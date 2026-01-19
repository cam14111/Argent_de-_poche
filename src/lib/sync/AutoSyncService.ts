/**
 * Service d'auto-synchronisation avec debounce
 * Synchronise automatiquement après une période d'inactivité
 */

import { syncService } from './SyncService'
import { syncQueueService } from './SyncQueueService'
import { syncStatusManager } from './SyncStatusManager'
import { settingsRepository } from '@/db'
import type { AutoSyncConfig } from './types'

const AUTO_SYNC_ENABLED_KEY = 'auto_sync_enabled'
const AUTO_SYNC_DEBOUNCE_MS_KEY = 'auto_sync_debounce_ms'

/**
 * Service d'auto-synchronisation
 */
export class AutoSyncService {
  private debounceTimer: number | null = null
  private isDirty = false
  private isEnabled = true
  private debounceMs = 5000 // 5 secondes par défaut

  /**
   * Initialise le service avec la configuration stockée
   */
  async initialize(): Promise<void> {
    const enabled = await settingsRepository.get(AUTO_SYNC_ENABLED_KEY)
    const debounceMs = await settingsRepository.get(AUTO_SYNC_DEBOUNCE_MS_KEY)

    this.isEnabled = enabled !== 'false'
    this.debounceMs = debounceMs ? parseInt(debounceMs, 10) : 5000

    console.log('[AutoSync] Initialized:', {
      enabled: this.isEnabled,
      debounceMs: this.debounceMs,
    })
  }

  /**
   * Marque les données comme modifiées (dirty)
   * Déclenche le debounce de synchronisation
   */
  markDirty(): void {
    if (!this.isEnabled) {
      console.log('[AutoSync] Disabled, skipping markDirty')
      return
    }

    this.isDirty = true
    this.scheduleSyncWithDebounce()
  }

  /**
   * Planifie une synchronisation avec debounce
   */
  private scheduleSyncWithDebounce(): void {
    // Annuler le timer précédent
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer)
    }

    // Créer un nouveau timer
    this.debounceTimer = window.setTimeout(() => {
      this.performSync().catch(console.error)
    }, this.debounceMs)

    console.log(`[AutoSync] Scheduled sync in ${this.debounceMs}ms`)
  }

  /**
   * Effectue la synchronisation
   */
  private async performSync(): Promise<void> {
    if (!this.isDirty) {
      console.log('[AutoSync] Not dirty, skipping sync')
      return
    }

    console.log('[AutoSync] Performing auto-sync...')

    try {
      // Vérifier si la synchronisation est disponible
      const available = await syncService.isAvailable()

      if (!available) {
        console.log('[AutoSync] Sync not available, adding to queue')
        await syncQueueService.enqueue('BACKUP')
        this.isDirty = false
        return
      }

      syncStatusManager.startSync()

      // Synchroniser
      await syncService.sync()
      this.isDirty = false
      await syncStatusManager.endSync()

      console.log('[AutoSync] Auto-sync completed')
    } catch (error) {
      console.error('[AutoSync] Sync error:', error)
      const message = error instanceof Error ? error.message : String(error)
      syncStatusManager.setSyncError(message)

      // Ajouter à la queue en cas d'erreur
      try {
        await syncQueueService.enqueue('BACKUP')
        this.isDirty = false
      } catch (queueError) {
        console.error('[AutoSync] Failed to enqueue:', queueError)
      }
    }
  }

  /**
   * Force une synchronisation immédiate
   */
  async syncNow(): Promise<void> {
    // Annuler le timer de debounce
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    // Synchroniser immédiatement
    await this.performSync()
  }

  /**
   * Active l'auto-synchronisation
   */
  async enable(): Promise<void> {
    this.isEnabled = true
    await settingsRepository.set(AUTO_SYNC_ENABLED_KEY, 'true')
    console.log('[AutoSync] Enabled')
  }

  /**
   * Désactive l'auto-synchronisation
   */
  async disable(): Promise<void> {
    this.isEnabled = false
    await settingsRepository.set(AUTO_SYNC_ENABLED_KEY, 'false')

    // Annuler le timer en cours
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    console.log('[AutoSync] Disabled')
  }

  /**
   * Configure le délai de debounce
   */
  async setDebounceMs(ms: number): Promise<void> {
    this.debounceMs = ms
    await settingsRepository.set(AUTO_SYNC_DEBOUNCE_MS_KEY, String(ms))
    console.log('[AutoSync] Debounce set to', ms, 'ms')
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): AutoSyncConfig {
    return {
      enabled: this.isEnabled,
      debounceMs: this.debounceMs,
      retryOnError: true,
    }
  }

  /**
   * Vérifie si des modifications sont en attente
   */
  isDirtyFlag(): boolean {
    return this.isDirty
  }

  /**
   * Réinitialise le flag dirty (utile pour les tests)
   */
  resetDirty(): void {
    this.isDirty = false
  }
}

/**
 * Instance singleton du service
 */
export const autoSyncService = new AutoSyncService()
