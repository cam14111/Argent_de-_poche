/**
 * Manager du statut de synchronisation
 * Gère l'état global de la synchronisation et notifie les changements
 */

import { syncOperationRepository } from '@/db/repositories'
import { syncService } from './SyncService'
import type { SyncStatus, SyncState, SyncStatusCallback } from './types'

/**
 * Manager du statut de synchronisation
 */
export class SyncStatusManager {
  private status: SyncStatus = 'synced'
  private subscribers = new Set<SyncStatusCallback>()
  private lastSyncAt: Date | null = null
  private error: string | null = null

  /**
   * Initialise le manager
   */
  async initialize(): Promise<void> {
    this.lastSyncAt = await syncService.getLastSyncAt()
    await this.computeStatus()
  }

  /**
   * S'abonne aux changements de statut
   */
  subscribe(callback: SyncStatusCallback): () => void {
    this.subscribers.add(callback)

    // Notifier immédiatement avec l'état actuel
    callback(this.getState())

    // Retourner une fonction de désabonnement
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Définit le statut
   */
  setStatus(status: SyncStatus, error?: string): void {
    const oldStatus = this.status
    this.status = status
    this.error = error || null

    if (oldStatus !== status) {
      console.log(`[SyncStatus] Status changed: ${oldStatus} → ${status}`)
      this.notifySubscribers()
    }
  }

  /**
   * Récupère le statut actuel
   */
  getStatus(): SyncStatus {
    return this.status
  }

  /**
   * Récupère l'état complet
   */
  getState(): SyncState {
    return {
      status: this.status,
      lastSyncAt: this.lastSyncAt,
      pendingCount: 0, // Sera mis à jour par computeStatus
      error: this.error,
      isOnline: navigator.onLine,
    }
  }

  /**
   * Calcule le statut basé sur l'état des opérations
   */
  async computeStatus(): Promise<SyncStatus> {
    const pendingCount = await syncOperationRepository.getPendingCount()
    const failedCount = await syncOperationRepository.getFailedCount()

    let newStatus: SyncStatus = 'synced'

    if (pendingCount > 0) {
      newStatus = 'pending'
    } else if (failedCount > 0) {
      newStatus = 'error'
    }

    this.setStatus(newStatus)
    return newStatus
  }

  /**
   * Marque le début d'une synchronisation
   */
  startSync(): void {
    this.setStatus('syncing')
  }

  /**
   * Marque la fin d'une synchronisation réussie
   */
  async endSync(): Promise<void> {
    this.lastSyncAt = new Date()
    this.error = null
    await this.computeStatus()
  }

  /**
   * Marque une erreur de synchronisation
   */
  setSyncError(error: string): void {
    this.error = error
    this.setStatus('error', error)
  }

  /**
   * Met à jour le nombre d'opérations en attente
   */
  async updatePendingCount(): Promise<number> {
    const count = await syncOperationRepository.getPendingCount()
    await this.computeStatus()
    return count
  }

  /**
   * Notifie tous les abonnés
   */
  private notifySubscribers(): void {
    const state = this.getState()

    // Mettre à jour le pending count de manière asynchrone
    syncOperationRepository.getPendingCount().then((count) => {
      const updatedState = { ...state, pendingCount: count }
      this.subscribers.forEach((callback) => callback(updatedState))
    })
  }

  /**
   * Réinitialise le statut
   */
  reset(): void {
    this.status = 'synced'
    this.lastSyncAt = null
    this.error = null
    this.notifySubscribers()
  }

  /**
   * Récupère la date de dernière synchronisation
   */
  getLastSyncAt(): Date | null {
    return this.lastSyncAt
  }

  /**
   * Récupère le message d'erreur
   */
  getError(): string | null {
    return this.error
  }
}

/**
 * Instance singleton du manager
 */
export const syncStatusManager = new SyncStatusManager()
