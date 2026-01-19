/**
 * Hook pour accéder au statut de synchronisation
 */

import { useSync } from '@/contexts/SyncContext'
import type { SyncStatus } from '@/lib/sync'

/**
 * Interface du résultat du hook
 */
export interface UseSyncStatusResult {
  status: SyncStatus
  lastSyncAt: Date | null
  pendingCount: number
  error: string | null
  isOnline: boolean
  isSyncing: boolean
  isPending: boolean
  hasError: boolean
  isSynced: boolean
}

/**
 * Hook pour utiliser le statut de synchronisation
 */
export function useSyncStatus(): UseSyncStatusResult {
  const sync = useSync()

  return {
    status: sync.status,
    lastSyncAt: sync.lastSyncAt,
    pendingCount: sync.pendingCount,
    error: sync.error,
    isOnline: sync.isOnline,

    // Helpers
    isSyncing: sync.status === 'syncing',
    isPending: sync.status === 'pending',
    hasError: sync.status === 'error',
    isSynced: sync.status === 'synced',
  }
}
