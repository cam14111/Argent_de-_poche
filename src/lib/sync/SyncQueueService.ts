/**
 * Service de gestion de la queue de synchronisation offline
 * Gère le retry automatique avec backoff exponentiel
 */

import { db, type SyncOperation } from '@/db'
import { syncOperationRepository } from '@/db/repositories'
import { syncService } from './SyncService'
import { syncStatusManager } from './SyncStatusManager'
import { calculateRetryDelay } from './utils'

/**
 * Service de queue de synchronisation
 */
export class SyncQueueService {
  private isProcessing = false
  private processingInterval: number | null = null

  /**
   * Ajoute une opération à la queue
   */
  async enqueue(
    type: 'BACKUP' | 'RESTORE',
    payload?: any
  ): Promise<number> {
    const id = await syncOperationRepository.create({
      type,
      status: 'PENDING',
      payload: payload ? JSON.stringify(payload) : undefined,
      attempts: 0,
      maxAttempts: 5,
    })

    console.log(`[SyncQueue] Enqueued ${type} operation:`, id)

    // Notifier le status manager du changement
    await syncStatusManager.updatePendingCount()

    // Déclencher le traitement de la queue
    this.processQueue().catch(console.error)

    return id
  }

  /**
   * Traite toutes les opérations en attente
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[SyncQueue] Already processing, skipping...')
      return
    }

    this.isProcessing = true

    try {
      const pending = await syncOperationRepository.getPending()

      console.log(`[SyncQueue] Processing ${pending.length} pending operations`)

      for (const operation of pending) {
        await this.processOperation(operation)
      }
    } catch (error) {
      console.error('[SyncQueue] Error processing queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Traite une opération individuelle
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    console.log(`[SyncQueue] Processing operation ${operation.id}`)

    try {
      // Marquer comme en cours
      await syncOperationRepository.update(operation.id!, {
        status: 'IN_PROGRESS',
      })

      // Exécuter l'opération
      if (operation.type === 'BACKUP') {
        await syncService.upload()
      } else if (operation.type === 'RESTORE') {
        await syncService.sync()
      }

      // Marquer comme complétée
      await syncOperationRepository.update(operation.id!, {
        status: 'COMPLETED',
      })

      // Notifier le status manager du changement
      await syncStatusManager.updatePendingCount()

      console.log(`[SyncQueue] Operation ${operation.id} completed`)
    } catch (error) {
      await this.handleOperationError(operation, error)
    }
  }

  /**
   * Gère les erreurs d'opération avec retry
   */
  private async handleOperationError(
    operation: SyncOperation,
    error: unknown
  ): Promise<void> {
    const nextAttempt = operation.attempts + 1
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(
      `[SyncQueue] Operation ${operation.id} failed (attempt ${nextAttempt}/${operation.maxAttempts}):`,
      errorMessage
    )

    if (nextAttempt >= operation.maxAttempts) {
      // Échec permanent
      await syncOperationRepository.update(operation.id!, {
        status: 'FAILED',
        error: errorMessage,
        attempts: nextAttempt,
      })

      // Notifier le status manager du changement
      await syncStatusManager.updatePendingCount()

      console.error(`[SyncQueue] Operation ${operation.id} permanently failed`)
    } else {
      // Calculer le délai de retry
      const delay = calculateRetryDelay(nextAttempt)
      const nextRetryAt = new Date(Date.now() + delay)

      // Marquer pour retry
      await syncOperationRepository.update(operation.id!, {
        status: 'PENDING',
        attempts: nextAttempt,
        nextRetryAt,
        error: errorMessage,
      })

      // Notifier le status manager du changement
      await syncStatusManager.updatePendingCount()

      console.log(
        `[SyncQueue] Operation ${operation.id} will retry at`,
        nextRetryAt
      )
    }
  }

  /**
   * Démarre le traitement automatique de la queue
   * À appeler au démarrage de l'app et lors du retour online
   */
  startAutoProcessing(intervalMs = 30000): void {
    if (this.processingInterval !== null) {
      return // Déjà démarré
    }

    console.log('[SyncQueue] Starting auto-processing')

    this.processingInterval = window.setInterval(() => {
      this.processQueue().catch(console.error)
    }, intervalMs)

    // Traiter immédiatement
    this.processQueue().catch(console.error)
  }

  /**
   * Arrête le traitement automatique
   */
  stopAutoProcessing(): void {
    if (this.processingInterval !== null) {
      window.clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('[SyncQueue] Stopped auto-processing')
    }
  }

  /**
   * Récupère le nombre d'opérations en attente
   */
  async getPendingCount(): Promise<number> {
    return syncOperationRepository.getPendingCount()
  }

  /**
   * Récupère le nombre d'opérations échouées
   */
  async getFailedCount(): Promise<number> {
    return syncOperationRepository.getFailedCount()
  }

  /**
   * Supprime toutes les opérations complétées (nettoyage)
   */
  async clearCompleted(): Promise<void> {
    const count = await syncOperationRepository.clearCompleted()
    console.log(`[SyncQueue] Cleared ${count} completed operations`)
  }

  /**
   * Réessaye toutes les opérations échouées
   */
  async retryFailed(): Promise<void> {
    const failed = await db.syncOperations
      .where('status')
      .equals('FAILED')
      .toArray()

    for (const op of failed) {
      await syncOperationRepository.update(op.id!, {
        status: 'PENDING',
        attempts: 0,
        nextRetryAt: undefined,
        error: undefined,
      })
    }

    // Notifier le status manager du changement
    await syncStatusManager.updatePendingCount()

    console.log(`[SyncQueue] Retrying ${failed.length} failed operations`)
    await this.processQueue()
  }

  /**
   * Vide complètement la queue (réinitialisation)
   */
  async clear(): Promise<void> {
    await syncOperationRepository.clearAll()

    // Notifier le status manager du changement
    await syncStatusManager.updatePendingCount()

    console.log('[SyncQueue] Queue cleared')
  }
}

/**
 * Instance singleton du service
 */
export const syncQueueService = new SyncQueueService()
