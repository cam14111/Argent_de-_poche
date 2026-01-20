/**
 * Types TypeScript pour le système de synchronisation multi-appareils
 */

/**
 * Statut de synchronisation
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error'

/**
 * Mode de synchronisation
 */
export type SyncMode = 'owner' | 'member' | 'none'

/**
 * Métadonnées de synchronisation stockées localement
 */
export interface SyncMetadata {
  lastSyncAt: string | null
  lastBackupHash: string | null
  pendingOperations: number
  syncMode: SyncMode
  remoteOwnerId?: string
}

/**
 * Informations du dossier partagé (fichier SHARED_FOLDER_INFO.json sur Drive)
 */
export interface SharedFolderInfo {
  /** @deprecated Utiliser ownerIds à la place. Gardé pour rétrocompatibilité. */
  ownerId?: string
  /** Liste des emails des parents autorisés à synchroniser en lecture/écriture */
  ownerIds: string[]
  createdAt: string
  appVersion: string
  sharedMode: boolean
}

/**
 * Résultat d'une opération de merge avec logs
 */
export interface MergeResult<T> {
  merged: T[]
  conflicts: ConflictLog[]
}

/**
 * Log d'un conflit résolu
 */
export interface ConflictLog {
  entityType: 'profile' | 'user' | 'motif' | 'transaction' | 'setting'
  entityId: number | string
  resolution: 'local_wins' | 'remote_wins' | 'local_wins_tie' | 'union'
  localValue?: any
  remoteValue?: any
  timestamp: string
}

/**
 * Options de synchronisation
 */
export interface SyncOptions {
  force?: boolean
  skipBackup?: boolean
  skipDownload?: boolean
}

/**
 * État du service de synchronisation
 */
export interface SyncState {
  status: SyncStatus
  lastSyncAt: Date | null
  pendingCount: number
  error: string | null
  isOnline: boolean
}

/**
 * Événement de changement de statut
 */
export interface SyncStatusChangeEvent {
  oldStatus: SyncStatus
  newStatus: SyncStatus
  timestamp: Date
  message?: string
}

/**
 * Callback pour les changements de statut
 */
export type SyncStatusCallback = (state: SyncState) => void

/**
 * Configuration du service d'auto-sync
 */
export interface AutoSyncConfig {
  enabled: boolean
  debounceMs: number
  retryOnError: boolean
}
