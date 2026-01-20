/**
 * Service principal de synchronisation
 * Orchestre la synchronisation entre l'appareil local et Google Drive
 */

import { GoogleDriveService } from '../googleDrive'
import { GoogleAuthService } from '../googleAuth'
import { JsonExporter, JsonImporter, type BackupPayload } from '../backup'
import {
  GOOGLE_DRIVE_LAST_BACKUP_KEY,
  GOOGLE_DRIVE_RETENTION_KEY,
} from '../backupManager'
import { settingsRepository } from '@/db'
import { mergeBackups, getAndClearConflictLogs } from './SyncMergeStrategy'
import { sha256Hash } from './utils'
import type { SyncOptions, ConflictLog, SyncMode } from './types'

const LAST_SYNC_AT_KEY = 'sync_last_sync_at'
const LAST_BACKUP_HASH_KEY = 'sync_last_backup_hash'

/**
 * Erreur de synchronisation
 */
export class SyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncError'
  }
}

/**
 * Service de synchronisation
 */
export class SyncService {
  private mode: SyncMode = 'none'

  constructor(
    private drive: GoogleDriveService = new GoogleDriveService(),
    private auth = GoogleAuthService
  ) {}

  /**
   * Définit le mode de synchronisation (owner/member/none)
   */
  setMode(mode: SyncMode): void {
    this.mode = mode
    console.log('[SyncService] Mode set to:', mode)
  }

  /**
   * Récupère le mode de synchronisation actuel
   */
  getMode(): SyncMode {
    return this.mode
  }

  /**
   * Vérifie si la synchronisation est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.auth.getAccessToken({ interactive: false })
      return true
    } catch {
      return false
    }
  }

  /**
   * Synchronisation complète : télécharge, merge, et upload
   * En mode member (enfant), ne télécharge que les données sans upload
   */
  async sync(options: SyncOptions = {}): Promise<ConflictLog[]> {
    const available = await this.isAvailable()
    if (!available) {
      throw new SyncError('Authentification Google requise pour synchroniser')
    }

    console.log('[SyncService] Starting sync...', { mode: this.mode })

    try {
      // En mode member (enfant), on ne fait que télécharger et importer
      if (this.mode === 'member') {
        console.log('[SyncService] Member mode - downloading data only...')
        const remotePayload = await this.downloadLatestBackup()

        if (!remotePayload) {
          console.log('[SyncService] No backup found in shared folder')
          return []
        }

        // Importer les données distantes en mode replace (lecture seule)
        if (!options.skipDownload) {
          await JsonImporter.importPayload(remotePayload, 'replace')
        }

        // Mettre à jour les métadonnées
        const remoteHash = await sha256Hash(JSON.stringify(remotePayload))
        await this.updateSyncMetadata(remoteHash)

        console.log('[SyncService] Member sync completed - data imported')
        return []
      }

      // Mode owner ou none : comportement standard avec upload
      // 1. Export des données locales
      const localPayload = await JsonExporter.exportPayload()

      // 2. Vérifier s'il y a des changements locaux
      const localHash = await sha256Hash(JSON.stringify(localPayload))
      const lastHash = await settingsRepository.get(LAST_BACKUP_HASH_KEY)

      const hasLocalChanges = localHash !== lastHash

      // 3. Télécharger le backup distant (s'il existe)
      const remotePayload = await this.downloadLatestBackup()

      if (!remotePayload) {
        // Pas de backup distant, c'est le premier sync
        console.log('[SyncService] First sync, uploading local data...')
        await this.upload(localPayload)
        await this.updateSyncMetadata(localHash)
        return []
      }

      // 4. Vérifier s'il y a des changements distants
      const remoteHash = await sha256Hash(JSON.stringify(remotePayload))
      const hasRemoteChanges = remoteHash !== lastHash

      if (!hasLocalChanges && !hasRemoteChanges) {
        console.log('[SyncService] No changes detected, skipping sync')
        return []
      }

      // 5. Merger les données
      console.log('[SyncService] Merging local and remote data...')
      const mergedPayload = mergeBackups(localPayload, remotePayload)
      const conflicts = getAndClearConflictLogs()

      // 6. Importer les données mergées localement
      if (!options.skipDownload) {
        await JsonImporter.importPayload(mergedPayload, 'replace')
      }

      // 7. Upload le backup mergé
      if (!options.skipBackup) {
        await this.upload(mergedPayload)
      }

      // 8. Mettre à jour les métadonnées
      const mergedHash = await sha256Hash(JSON.stringify(mergedPayload))
      await this.updateSyncMetadata(mergedHash)

      console.log(`[SyncService] Sync completed. Conflicts: ${conflicts.length}`)
      return conflicts
    } catch (error) {
      console.error('[SyncService] Sync error:', error)
      throw new SyncError(
        `Erreur de synchronisation: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Upload des données locales vers Drive
   * Autorisé uniquement en mode owner
   */
  async upload(payload?: BackupPayload): Promise<void> {
    const available = await this.isAvailable()
    if (!available) {
      throw new SyncError('Authentification Google requise pour uploader')
    }

    // Bloquer l'upload sauf en mode owner
    if (this.mode !== 'owner') {
      console.log('[SyncService] Upload blocked - mode is not owner:', this.mode)
      throw new SyncError('Upload non autorisé (mode: ' + this.mode + ')')
    }

    try {
      const dataToUpload = payload || (await JsonExporter.exportPayload())
      const content = JSON.stringify(dataToUpload, null, 2)

      // Générer le nom du fichier
      const date = new Date()
      const filename = `argent-de-poche-backup-${date.toISOString().slice(0, 10)}.json`

      // Upload vers Drive
      await this.drive.uploadFile({
        name: filename,
        content,
        mimeType: 'application/json',
        appProperties: {
          exportedAt: dataToUpload.exportedAt,
          schemaVersion: String(dataToUpload.schemaVersion),
        },
      })
      await settingsRepository.set(
        GOOGLE_DRIVE_LAST_BACKUP_KEY,
        dataToUpload.exportedAt
      )
      await this.pruneDriveBackups()

      console.log('[SyncService] Upload completed:', filename)
    } catch (error) {
      console.error('[SyncService] Upload error:', error)
      throw new SyncError(
        `Erreur d'upload: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Télécharge le backup le plus récent depuis Drive
   */
  async downloadLatestBackup(): Promise<BackupPayload | null> {
    try {
      const files = await this.drive.listBackupFiles()

      if (files.length === 0) {
        return null
      }

      // Trier par date de modification (le plus récent en premier)
      const sortedFiles = files
        .filter((f) => f.name.includes('argent-de-poche-backup'))
        .sort((a, b) => {
          const dateA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0
          const dateB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0
          return dateB - dateA
        })

      if (sortedFiles.length === 0) {
        return null
      }

      // Télécharger le plus récent
      const latestFile = sortedFiles[0]
      const content = await this.drive.downloadFile(latestFile.id)
      const payload = JsonImporter.parse(content)

      console.log('[SyncService] Downloaded latest backup:', latestFile.name)
      return payload
    } catch (error) {
      console.error('[SyncService] Download error:', error)
      return null
    }
  }

  /**
   * Vérifie s'il y a des changements distants
   */
  async hasRemoteChanges(): Promise<boolean> {
    try {
      const remotePayload = await this.downloadLatestBackup()
      if (!remotePayload) {
        return false
      }

      const remoteHash = await sha256Hash(JSON.stringify(remotePayload))
      const lastHash = await settingsRepository.get(LAST_BACKUP_HASH_KEY)

      return remoteHash !== lastHash
    } catch {
      return false
    }
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateSyncMetadata(hash: string): Promise<void> {
    await settingsRepository.set(LAST_SYNC_AT_KEY, new Date().toISOString())
    await settingsRepository.set(LAST_BACKUP_HASH_KEY, hash)
  }

  private async pruneDriveBackups(): Promise<void> {
    const value = await settingsRepository.get(GOOGLE_DRIVE_RETENTION_KEY)
    if (!value) return
    const limit = Number.parseInt(value, 10)
    if (Number.isNaN(limit) || limit <= 0) return

    const files = await this.drive.listBackupFiles()
    const toTimestamp = (entry: {
      appProperties?: Record<string, string>
      modifiedTime?: string
      createdTime?: string
    }) => {
      const exportedAt = entry.appProperties?.exportedAt
      const source = exportedAt ?? entry.modifiedTime ?? entry.createdTime
      if (!source) return 0
      const date = new Date(source)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    }

    const sorted = [...files].sort((a, b) => toTimestamp(b) - toTimestamp(a))
    const toDelete = sorted.slice(limit)
    for (const file of toDelete) {
      await this.drive.deleteFile(file.id)
    }
  }

  /**
   * Récupère la date de dernière synchronisation
   */
  async getLastSyncAt(): Promise<Date | null> {
    const value = await settingsRepository.get(LAST_SYNC_AT_KEY)
    return value ? new Date(value) : null
  }

  /**
   * Réinitialise les métadonnées de synchronisation
   */
  async resetMetadata(): Promise<void> {
    await settingsRepository.delete(LAST_SYNC_AT_KEY)
    await settingsRepository.delete(LAST_BACKUP_HASH_KEY)
  }
}

/**
 * Instance singleton du service
 */
export const syncService = new SyncService()
