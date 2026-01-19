/**
 * Hook pour marquer les données comme modifiées et déclencher l'auto-sync
 */

import { useEffect } from 'react'
import { autoSyncService } from '@/lib/sync'

/**
 * Hook pour marquer les données comme dirty après une modification
 * Utilisé dans les composants qui modifient des données
 */
export function useAutoSync() {
  /**
   * Marque les données comme modifiées
   * Déclenche l'auto-synchronisation avec debounce
   */
  const markDirty = () => {
    autoSyncService.markDirty()
  }

  /**
   * Force une synchronisation immédiate
   */
  const syncNow = async () => {
    await autoSyncService.syncNow()
  }

  return {
    markDirty,
    syncNow,
  }
}

/**
 * Hook pour marquer automatiquement dirty après un effet
 * Utile pour les formulaires de modification
 */
export function useAutoSyncEffect(dependencies: any[]) {
  useEffect(() => {
    if (dependencies.some((dep) => dep !== undefined && dep !== null)) {
      autoSyncService.markDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}
