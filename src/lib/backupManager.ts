import { settingsRepository } from '@/db'
import {
  BACKUP_SCHEMA_VERSION,
  JsonExporter,
  JsonImporter,
  buildBackupFileName,
  getBackupSummary,
  type BackupSummary,
  type ImportMode,
} from './backup'
import { GoogleDriveError, GoogleDriveService, type DriveFileEntry } from './googleDrive'

export const GOOGLE_DRIVE_LAST_BACKUP_KEY = 'google_drive_last_backup'
export const GOOGLE_DRIVE_RETENTION_KEY = 'google_drive_backup_retention'

export interface DriveBackupItem {
  id: string
  name: string
  size: number
  exportedAt?: string
  schemaVersion?: number
  createdTime?: string
}

export type BackupOperation = 'backup' | 'restore' | 'list' | 'preview' | 'delete'
export type BackupStatus = 'idle' | 'in_progress' | 'success' | 'error'

export interface BackupManagerState {
  status: BackupStatus
  operation?: BackupOperation
  error?: string
}

interface BackupManagerDependencies {
  driveService?: GoogleDriveService
  exporter?: typeof JsonExporter
  importer?: typeof JsonImporter
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function isRetryableError(error: unknown): boolean {
  if (error instanceof GoogleDriveError) {
    return RETRYABLE_STATUS.has(error.status)
  }
  return error instanceof TypeError
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(action: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await action()
    } catch (error) {
      lastError = error
      if (attempt >= attempts - 1 || !isRetryableError(error)) {
        throw error
      }
      await delay(500 * Math.pow(2, attempt))
    }
  }

  throw lastError
}

function mapDriveFileToBackup(file: DriveFileEntry): DriveBackupItem {
  const schemaVersion = file.appProperties?.schemaVersion
    ? Number(file.appProperties.schemaVersion)
    : undefined
  return {
    id: file.id,
    name: file.name,
    size: file.size ?? 0,
    exportedAt: file.appProperties?.exportedAt,
    schemaVersion,
    createdTime: file.createdTime,
  }
}

function sortBackups(backups: DriveBackupItem[]): DriveBackupItem[] {
  const toTimestamp = (value?: string) => {
    if (!value) return 0
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
  }

  return [...backups].sort((a, b) => {
    const aTime = toTimestamp(a.exportedAt ?? a.createdTime)
    const bTime = toTimestamp(b.exportedAt ?? b.createdTime)
    return bTime - aTime
  })
}

export class BackupManager {
  private state: BackupManagerState = { status: 'idle' }
  private listeners = new Set<(state: BackupManagerState) => void>()
  private driveService: GoogleDriveService
  private exporter: typeof JsonExporter
  private importer: typeof JsonImporter

  constructor(dependencies: BackupManagerDependencies = {}) {
    this.driveService = dependencies.driveService ?? new GoogleDriveService()
    this.exporter = dependencies.exporter ?? JsonExporter
    this.importer = dependencies.importer ?? JsonImporter
  }

  getState(): BackupManagerState {
    return this.state
  }

  subscribe(listener: (state: BackupManagerState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private updateState(next: BackupManagerState): void {
    this.state = next
    this.listeners.forEach((listener) => listener(this.state))
  }

  private async fetchBackups(): Promise<DriveBackupItem[]> {
    const files = await withRetry(() => this.driveService.listBackupFiles())
    return sortBackups(files.map(mapDriveFileToBackup))
  }

  async listBackups(): Promise<DriveBackupItem[]> {
    this.updateState({ status: 'in_progress', operation: 'list' })
    try {
      const backups = await this.fetchBackups()
      this.updateState({ status: 'success', operation: 'list' })
      return backups
    } catch (error) {
      this.updateState({
        status: 'error',
        operation: 'list',
        error: error instanceof Error ? error.message : 'Erreur lors du chargement.',
      })
      throw error
    }
  }

  async backup(): Promise<DriveBackupItem> {
    this.updateState({ status: 'in_progress', operation: 'backup' })
    try {
      const payload = await this.exporter.exportPayload()
      const json = JSON.stringify(payload, null, 2)
      const fileName = buildBackupFileName(new Date(payload.exportedAt))
      const file = await withRetry(() =>
        this.driveService.uploadFile({
          name: fileName,
          content: json,
          appProperties: {
            exportedAt: payload.exportedAt,
            schemaVersion: String(payload.schemaVersion ?? BACKUP_SCHEMA_VERSION),
          },
          description: `Backup Argent de Poche ${payload.exportedAt}`,
        })
      )

      await settingsRepository.set(GOOGLE_DRIVE_LAST_BACKUP_KEY, payload.exportedAt)

      const retention = await this.getRetentionLimit()
      if (retention !== null && retention > 0) {
        await this.pruneBackups(retention)
      }

      const backup = mapDriveFileToBackup(file)
      this.updateState({ status: 'success', operation: 'backup' })
      return backup
    } catch (error) {
      this.updateState({
        status: 'error',
        operation: 'backup',
        error: error instanceof Error ? error.message : 'Erreur lors du backup.',
      })
      throw error
    }
  }

  async preview(fileId: string): Promise<BackupSummary> {
    this.updateState({ status: 'in_progress', operation: 'preview' })
    try {
      const json = await withRetry(() => this.driveService.downloadFile(fileId))
      const payload = this.importer.parse(json)
      const summary = getBackupSummary(payload)
      this.updateState({ status: 'success', operation: 'preview' })
      return summary
    } catch (error) {
      this.updateState({
        status: 'error',
        operation: 'preview',
        error: error instanceof Error ? error.message : 'Erreur lors de la previsualisation.',
      })
      throw error
    }
  }

  async restore(fileId: string, mode: ImportMode): Promise<void> {
    this.updateState({ status: 'in_progress', operation: 'restore' })
    try {
      const json = await withRetry(() => this.driveService.downloadFile(fileId))
      const payload = this.importer.parse(json)
      await this.importer.importPayload(payload, mode)
      this.updateState({ status: 'success', operation: 'restore' })
    } catch (error) {
      this.updateState({
        status: 'error',
        operation: 'restore',
        error: error instanceof Error ? error.message : 'Erreur lors de la restauration.',
      })
      throw error
    }
  }

  async deleteBackup(fileId: string): Promise<void> {
    this.updateState({ status: 'in_progress', operation: 'delete' })
    try {
      await withRetry(() => this.driveService.deleteFile(fileId))
      const backups = await this.fetchBackups()
      const latest =
        backups[0]?.exportedAt ?? backups[0]?.createdTime ?? null
      if (latest) {
        await settingsRepository.set(GOOGLE_DRIVE_LAST_BACKUP_KEY, latest)
      } else {
        await settingsRepository.delete(GOOGLE_DRIVE_LAST_BACKUP_KEY)
      }
      this.updateState({ status: 'success', operation: 'delete' })
    } catch (error) {
      this.updateState({
        status: 'error',
        operation: 'delete',
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression.',
      })
      throw error
    }
  }

  async pruneBackups(limit: number): Promise<void> {
    if (!Number.isFinite(limit) || limit <= 0) return
    const backups = await this.fetchBackups()
    const toDelete = backups.slice(limit)
    for (const backup of toDelete) {
      await withRetry(() => this.driveService.deleteFile(backup.id))
    }
  }

  async getRetentionLimit(): Promise<number | null> {
    const value = await settingsRepository.get(GOOGLE_DRIVE_RETENTION_KEY)
    if (!value) return null
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  async setRetentionLimit(limit: number | null): Promise<void> {
    if (limit === null || Number.isNaN(limit)) {
      await settingsRepository.delete(GOOGLE_DRIVE_RETENTION_KEY)
      return
    }
    await settingsRepository.set(GOOGLE_DRIVE_RETENTION_KEY, String(limit))
  }

  async getLastBackupAt(): Promise<string | null> {
    const value = await settingsRepository.get(GOOGLE_DRIVE_LAST_BACKUP_KEY)
    return value ?? null
  }

  async clearLastBackup(): Promise<void> {
    await settingsRepository.delete(GOOGLE_DRIVE_LAST_BACKUP_KEY)
  }

  async clearDriveCache(): Promise<void> {
    await this.driveService.clearCachedFolder()
  }
}

export const backupManager = new BackupManager()
