/**
 * Hook React pour charger automatiquement les données pour les membres (enfants)
 */

import { useEffect, useState, useCallback } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { memberDataLoader } from '@/lib/sync'

interface MemberDataLoaderState {
  isLoading: boolean
  error: string | null
  lastLoadAt: number | null
  reload: () => Promise<void>
}

/**
 * Hook pour charger automatiquement les données en mode member
 * À utiliser dans les composants qui affichent des données (Dashboard, TransactionList)
 */
export function useMemberDataLoader(): MemberDataLoaderState {
  const { mode } = useSync()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadAt, setLastLoadAt] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    if (mode !== 'member') {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const loaded = await memberDataLoader.loadIfMember()
      if (loaded) {
        setLastLoadAt(Date.now())
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement'
      setError(message)
      console.error('[useMemberDataLoader] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  const reload = useCallback(async () => {
    if (mode !== 'member') {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await memberDataLoader.forceLoad()
      setLastLoadAt(Date.now())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement'
      setError(message)
      console.error('[useMemberDataLoader] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  // Charger les données au montage et quand le mode change
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    isLoading,
    error,
    lastLoadAt,
    reload,
  }
}
