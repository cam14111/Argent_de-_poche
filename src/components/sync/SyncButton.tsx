/**
 * Bouton de synchronisation manuelle
 * Permet de déclencher une synchronisation immédiate
 */

import { useState } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { Button } from '@/components/ui/Button'

/**
 * Props du composant
 */
interface SyncButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Composant SyncButton
 */
export function SyncButton({
  variant = 'ghost',
  size = 'md',
  label = 'Synchroniser',
  disabled = false,
  onSuccess,
  onError,
}: SyncButtonProps) {
  const { sync, isOnline } = useSync()
  const [isSyncing, setIsSyncing] = useState(false)

  /**
   * Gère le clic sur le bouton
   */
  const handleSync = async () => {
    if (!isOnline) {
      onError?.(new Error('Hors ligne'))
      return
    }

    setIsSyncing(true)

    try {
      const conflicts = await sync()
      console.log('[SyncButton] Sync completed, conflicts:', conflicts.length)
      onSuccess?.()
    } catch (error) {
      console.error('[SyncButton] Sync error:', error)
      onError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsSyncing(false)
    }
  }

  const isDisabled = disabled || isSyncing || !isOnline

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isDisabled}
    >
      {isSyncing ? (
        <>
          <span className="animate-spin">↻</span>
          <span className="ml-2">Synchronisation...</span>
        </>
      ) : (
        <>
          <span>↻</span>
          <span className="ml-2">{label}</span>
        </>
      )}
    </Button>
  )
}
