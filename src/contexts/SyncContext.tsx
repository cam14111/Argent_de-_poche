/**
 * Context React pour la synchronisation
 * Fournit l'accès aux services de sync dans toute l'application
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  syncService,
  syncStatusManager,
  autoSyncService,
  syncQueueService,
  SharedFolderDetector,
  type SyncStatus,
  type SyncMode,
  type ConflictLog,
} from '@/lib/sync'

/**
 * Interface du contexte de synchronisation
 */
interface SyncContextValue {
  // État
  status: SyncStatus
  mode: SyncMode
  lastSyncAt: Date | null
  pendingCount: number
  error: string | null
  isOnline: boolean

  // Actions
  sync: () => Promise<ConflictLog[]>
  syncNow: () => Promise<void>
  enableAutoSync: () => Promise<void>
  disableAutoSync: () => Promise<void>
  retryFailed: () => Promise<void>
  clearQueue: () => Promise<void>

  // Configuration
  autoSyncEnabled: boolean
  autoSyncDebounceMs: number
}

/**
 * Context de synchronisation
 */
const SyncContext = createContext<SyncContextValue | undefined>(undefined)

/**
 * Provider du contexte de synchronisation
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [mode, setMode] = useState<SyncMode>('none')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [autoSyncDebounceMs, setAutoSyncDebounceMs] = useState(5000)

  /**
   * Initialisation au montage
   */
  useEffect(() => {
    const initializeSync = async () => {
      // Initialiser les services
      await autoSyncService.initialize()
      await syncStatusManager.initialize()

      // Détecter le mode de synchronisation
      const detector = new SharedFolderDetector()
      const detectedMode = await detector.detectMode()
      setMode(detectedMode)

      // Récupérer la configuration
      const config = autoSyncService.getConfig()
      setAutoSyncEnabled(config.enabled)
      setAutoSyncDebounceMs(config.debounceMs)

      // Démarrer le traitement automatique de la queue
      syncQueueService.startAutoProcessing()

      console.log('[SyncContext] Initialized', {
        mode: detectedMode,
        autoSyncEnabled: config.enabled,
      })
    }

    initializeSync().catch(console.error)

    // S'abonner aux changements de statut
    const unsubscribe = syncStatusManager.subscribe((state) => {
      setStatus(state.status)
      setLastSyncAt(state.lastSyncAt)
      setPendingCount(state.pendingCount)
      setError(state.error)
    })

    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true)
      syncQueueService.processQueue().catch(console.error)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      unsubscribe()
      syncQueueService.stopAutoProcessing()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Synchronisation manuelle
   */
  const sync = async (): Promise<ConflictLog[]> => {
    try {
      syncStatusManager.startSync()
      const conflicts = await syncService.sync()
      await syncStatusManager.endSync()
      return conflicts
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      syncStatusManager.setSyncError(message)
      throw err
    }
  }

  /**
   * Synchronisation immédiate (force)
   */
  const syncNow = async (): Promise<void> => {
    await autoSyncService.syncNow()
  }

  /**
   * Active l'auto-synchronisation
   */
  const enableAutoSync = async (): Promise<void> => {
    await autoSyncService.enable()
    setAutoSyncEnabled(true)
  }

  /**
   * Désactive l'auto-synchronisation
   */
  const disableAutoSync = async (): Promise<void> => {
    await autoSyncService.disable()
    setAutoSyncEnabled(false)
  }

  /**
   * Réessaye toutes les opérations échouées
   */
  const retryFailed = async (): Promise<void> => {
    await syncQueueService.retryFailed()
    await syncStatusManager.updatePendingCount()
  }

  /**
   * Vide la queue
   */
  const clearQueue = async (): Promise<void> => {
    await syncQueueService.clear()
    await syncStatusManager.updatePendingCount()
  }

  const value: SyncContextValue = {
    // État
    status,
    mode,
    lastSyncAt,
    pendingCount,
    error,
    isOnline,

    // Actions
    sync,
    syncNow,
    enableAutoSync,
    disableAutoSync,
    retryFailed,
    clearQueue,

    // Configuration
    autoSyncEnabled,
    autoSyncDebounceMs,
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

/**
 * Hook pour utiliser le contexte de synchronisation
 */
export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}
