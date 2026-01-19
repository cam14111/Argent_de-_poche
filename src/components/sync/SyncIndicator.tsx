/**
 * Indicateur visuel de l'état de synchronisation
 * Affiche une icône dans la TopBar avec le statut actuel
 */

import { useSyncStatus } from '@/hooks/useSyncStatus'
import { formatRelativeTime } from '@/lib/sync'

/**
 * Props du composant
 */
interface SyncIndicatorProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Composant SyncIndicator
 */
export function SyncIndicator({ showLabel = false, size = 'md' }: SyncIndicatorProps) {
  const { status, lastSyncAt, pendingCount, isOnline } = useSyncStatus()

  // Icônes par statut
  const icons = {
    synced: '✓',
    syncing: '↻',
    pending: '⏸',
    error: '⚠',
  }

  // Couleurs par statut
  const colors = {
    synced: 'text-green-600',
    syncing: 'text-blue-600',
    pending: 'text-orange-600',
    error: 'text-red-600',
  }

  // Tailles
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  // Titres (tooltips)
  const titles = {
    synced: lastSyncAt
      ? `Synchronisé ${formatRelativeTime(lastSyncAt)}`
      : 'Synchronisé',
    syncing: 'Synchronisation en cours...',
    pending: `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`,
    error: 'Erreur de synchronisation',
  }

  // Afficher l'indicateur offline si hors ligne
  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-2 text-gray-500"
        title="Hors ligne"
      >
        <span className={sizes[size]}>⚫</span>
        {showLabel && <span className="text-xs">Hors ligne</span>}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 ${colors[status]}`}
      title={titles[status]}
    >
      <span
        className={`${sizes[size]} ${status === 'syncing' ? 'animate-spin' : ''}`}
      >
        {icons[status]}
      </span>
      {showLabel && status === 'pending' && pendingCount > 0 && (
        <span className="text-xs">({pendingCount})</span>
      )}
    </div>
  )
}
