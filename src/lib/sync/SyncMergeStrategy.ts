/**
 * Service de merge intelligent pour la synchronisation multi-appareils
 * Implémente les stratégies de fusion pour chaque type d'entité
 */

import type { Profile, User, Transaction, Motif, Settings } from '@/db'
import type { BackupPayload } from '../backup'
import type { MergeResult, ConflictLog } from './types'

/**
 * Clés de settings à exclure de la synchronisation (local à l'appareil)
 */
export const EXCLUDED_SETTINGS_KEYS = new Set([
  'pin_hash',
  'auth_mode',
  'google_drive_token',
  'google_drive_folder_id',
  'google_profile',
  'google_drive_last_backup',
])

/**
 * Logs de conflits pour traçabilité
 */
const conflictLogs: ConflictLog[] = []

/**
 * Ajoute un log de conflit
 */
function logConflict(log: ConflictLog): void {
  conflictLogs.push(log)
  console.log('[SyncMerge] Conflict resolved:', log)
}

/**
 * Récupère et vide les logs de conflits
 */
export function getAndClearConflictLogs(): ConflictLog[] {
  return conflictLogs.splice(0, conflictLogs.length)
}

/**
 * Calcule un hash simple pour détecter des modifications de contenu
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Hash de contenu pour un profil
 */
function hashProfile(profile: Profile): string {
  return simpleHash(`${profile.name}|${profile.color}|${profile.icon}`)
}

/**
 * Hash de contenu pour un user
 */
function hashUser(user: User): string {
  return simpleHash(`${user.name}|${user.role}|${user.profileId ?? 'null'}`)
}

/**
 * Hash de contenu pour un motif
 */
function hashMotif(motif: Motif): string {
  return simpleHash(`${motif.label}|${motif.type}|${motif.icon}`)
}

/**
 * Merge des transactions : UNION par ID
 * Toutes les transactions sont conservées, pas de conflit possible
 */
export function mergeTransactions(
  local: Transaction[],
  remote: Transaction[]
): MergeResult<Transaction> {
  const byId = new Map<number, Transaction>()

  // Union : ajouter toutes les transactions (local + distant)
  for (const tx of [...local, ...remote]) {
    if (!byId.has(tx.id!)) {
      byId.set(tx.id!, tx)
    }
  }

  return {
    merged: Array.from(byId.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ),
    conflicts: [],
  }
}

/**
 * Merge des profils : Timestamp récent gagne
 */
export function mergeProfiles(
  local: Profile[],
  remote: Profile[]
): MergeResult<Profile> {
  const byId = new Map<number, Profile>()
  const conflicts: ConflictLog[] = []

  // Ajouter tous les profils locaux
  for (const profile of local) {
    byId.set(profile.id!, profile)
  }

  // Merger avec les profils distants
  for (const remoteProfile of remote) {
    const existing = byId.get(remoteProfile.id!)

    if (!existing) {
      // Nouveau profil distant, on l'ajoute
      byId.set(remoteProfile.id!, remoteProfile)
    } else {
      // Conflit : comparer les timestamps
      const localTime = (existing.updatedAt || existing.createdAt).getTime()
      const remoteTime = (remoteProfile.updatedAt || remoteProfile.createdAt).getTime()

      if (remoteTime > localTime) {
        // Version distante plus récente, on écrase
        byId.set(remoteProfile.id!, remoteProfile)
        conflicts.push({
          entityType: 'profile',
          entityId: remoteProfile.id!,
          resolution: 'remote_wins',
          localValue: existing,
          remoteValue: remoteProfile,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      } else if (remoteTime === localTime) {
        // Même timestamp : comparer hash de contenu
        const localHash = hashProfile(existing)
        const remoteHash = hashProfile(remoteProfile)

        if (localHash !== remoteHash) {
          // Modification concurrente avec même timestamp (rare)
          // On garde la locale par défaut
          conflicts.push({
            entityType: 'profile',
            entityId: remoteProfile.id!,
            resolution: 'local_wins_tie',
            localValue: existing,
            remoteValue: remoteProfile,
            timestamp: new Date().toISOString(),
          })
          logConflict(conflicts[conflicts.length - 1])
        }
      } else {
        // Version locale plus récente, on garde la locale
        conflicts.push({
          entityType: 'profile',
          entityId: existing.id!,
          resolution: 'local_wins',
          localValue: existing,
          remoteValue: remoteProfile,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      }
    }
  }

  return {
    merged: Array.from(byId.values()),
    conflicts,
  }
}

/**
 * Merge des users : Timestamp récent gagne
 */
export function mergeUsers(
  local: User[],
  remote: User[]
): MergeResult<User> {
  const byId = new Map<number, User>()
  const conflicts: ConflictLog[] = []

  for (const user of local) {
    byId.set(user.id!, user)
  }

  for (const remoteUser of remote) {
    const existing = byId.get(remoteUser.id!)

    if (!existing) {
      byId.set(remoteUser.id!, remoteUser)
    } else {
      const localTime = (existing.updatedAt || existing.createdAt).getTime()
      const remoteTime = (remoteUser.updatedAt || remoteUser.createdAt).getTime()

      if (remoteTime > localTime) {
        byId.set(remoteUser.id!, remoteUser)
        conflicts.push({
          entityType: 'user',
          entityId: remoteUser.id!,
          resolution: 'remote_wins',
          localValue: existing,
          remoteValue: remoteUser,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      } else if (remoteTime === localTime) {
        const localHash = hashUser(existing)
        const remoteHash = hashUser(remoteUser)

        if (localHash !== remoteHash) {
          conflicts.push({
            entityType: 'user',
            entityId: remoteUser.id!,
            resolution: 'local_wins_tie',
            localValue: existing,
            remoteValue: remoteUser,
            timestamp: new Date().toISOString(),
          })
          logConflict(conflicts[conflicts.length - 1])
        }
      } else {
        conflicts.push({
          entityType: 'user',
          entityId: existing.id!,
          resolution: 'local_wins',
          localValue: existing,
          remoteValue: remoteUser,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      }
    }
  }

  return {
    merged: Array.from(byId.values()),
    conflicts,
  }
}

/**
 * Merge des motifs : Timestamp récent gagne, respecter isDefault
 */
export function mergeMotifs(
  local: Motif[],
  remote: Motif[]
): MergeResult<Motif> {
  const byId = new Map<number, Motif>()
  const conflicts: ConflictLog[] = []

  for (const motif of local) {
    byId.set(motif.id!, motif)
  }

  for (const remoteMotif of remote) {
    const existing = byId.get(remoteMotif.id!)

    if (!existing) {
      byId.set(remoteMotif.id!, remoteMotif)
    } else {
      // Les motifs par défaut ne sont jamais écrasés
      if (existing.isDefault && remoteMotif.isDefault) {
        continue // Garder la locale
      }

      const localTime = (existing.updatedAt || new Date(0)).getTime()
      const remoteTime = (remoteMotif.updatedAt || new Date(0)).getTime()

      if (remoteTime > localTime) {
        byId.set(remoteMotif.id!, remoteMotif)
        conflicts.push({
          entityType: 'motif',
          entityId: remoteMotif.id!,
          resolution: 'remote_wins',
          localValue: existing,
          remoteValue: remoteMotif,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      } else if (remoteTime === localTime) {
        const localHash = hashMotif(existing)
        const remoteHash = hashMotif(remoteMotif)

        if (localHash !== remoteHash) {
          conflicts.push({
            entityType: 'motif',
            entityId: remoteMotif.id!,
            resolution: 'local_wins_tie',
            localValue: existing,
            remoteValue: remoteMotif,
            timestamp: new Date().toISOString(),
          })
          logConflict(conflicts[conflicts.length - 1])
        }
      } else {
        conflicts.push({
          entityType: 'motif',
          entityId: existing.id!,
          resolution: 'local_wins',
          localValue: existing,
          remoteValue: remoteMotif,
          timestamp: new Date().toISOString(),
        })
        logConflict(conflicts[conflicts.length - 1])
      }
    }
  }

  return {
    merged: Array.from(byId.values()),
    conflicts,
  }
}

/**
 * Merge des settings : Stratégie par clé, exclure clés sensibles
 */
export function mergeSettings(
  local: Settings[],
  remote: Settings[]
): MergeResult<Settings> {
  const byKey = new Map<string, Settings>()

  // Ajouter settings locales
  for (const setting of local) {
    byKey.set(setting.key, setting)
  }

  // Merger settings distantes
  for (const remoteSetting of remote) {
    if (EXCLUDED_SETTINGS_KEYS.has(remoteSetting.key)) {
      // Ne jamais synchroniser ces clés
      continue
    }

    const existing = byKey.get(remoteSetting.key)
    if (!existing || remoteSetting.value !== existing.value) {
      // Nouvelle clé ou valeur différente : prendre la distante
      byKey.set(remoteSetting.key, remoteSetting)
    }
  }

  return {
    merged: Array.from(byKey.values()),
    conflicts: [],
  }
}

/**
 * Merge complet de deux backups
 */
export function mergeBackups(
  local: BackupPayload,
  remote: BackupPayload
): BackupPayload {
  const profilesResult = mergeProfiles(local.data.profiles, remote.data.profiles)
  const usersResult = mergeUsers(local.data.users, remote.data.users)
  const transactionsResult = mergeTransactions(
    local.data.transactions,
    remote.data.transactions
  )
  const motifsResult = mergeMotifs(local.data.motifs, remote.data.motifs)
  const settingsResult = mergeSettings(local.data.settings, remote.data.settings)

  // Log du nombre total de conflits
  const totalConflicts =
    profilesResult.conflicts.length +
    usersResult.conflicts.length +
    motifsResult.conflicts.length

  if (totalConflicts > 0) {
    console.log(`[SyncMerge] Total conflicts resolved: ${totalConflicts}`)
  }

  return {
    schemaVersion: Math.max(local.schemaVersion, remote.schemaVersion),
    exportedAt: new Date().toISOString(),
    data: {
      profiles: profilesResult.merged,
      users: usersResult.merged,
      transactions: transactionsResult.merged,
      motifs: motifsResult.merged,
      settings: settingsResult.merged,
    },
  }
}
