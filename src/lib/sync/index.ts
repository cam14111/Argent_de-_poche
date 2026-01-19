/**
 * Point d'entrée du module de synchronisation
 */

// Services
export { syncService, SyncService, SyncError } from './SyncService'
export {
  syncQueueService,
  SyncQueueService,
} from './SyncQueueService'
export {
  autoSyncService,
  AutoSyncService,
} from './AutoSyncService'
export {
  syncStatusManager,
  SyncStatusManager,
} from './SyncStatusManager'
export {
  SharedFolderDetector,
  SharedFolderError,
} from './SharedFolderDetector'
export {
  memberDataLoader,
  MemberDataLoader,
} from './MemberDataLoader'

// Merge strategies
export {
  mergeBackups,
  mergeTransactions,
  mergeProfiles,
  mergeUsers,
  mergeMotifs,
  mergeSettings,
  getAndClearConflictLogs,
} from './SyncMergeStrategy'

// Utilitaires
export {
  isNetworkError,
  calculateRetryDelay,
  formatRelativeTime,
  formatBytes,
  sha256Hash,
  debounce,
  throttle,
} from './utils'

// Types
export type {
  SyncStatus,
  SyncMode,
  SyncMetadata,
  SharedFolderInfo,
  MergeResult,
  ConflictLog,
  SyncOptions,
  SyncState,
  SyncStatusChangeEvent,
  SyncStatusCallback,
  AutoSyncConfig,
} from './types'
