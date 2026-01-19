import { db, type Profile, type User, type Transaction, type Motif, type Settings } from '@/db'
import {
  encryptBackup,
  decryptBackup,
  isEncryptedBackup,
  type EncryptedBackup,
} from './backupEncryption'
import { EXCLUDED_SETTINGS_KEYS } from './sync/SyncMergeStrategy'

export const BACKUP_SCHEMA_VERSION = 3 // Sprint 6: Ajout support archivedAt

export type ImportMode = 'replace' | 'merge'

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  data: {
    profiles: Profile[]
    users: User[]
    transactions: Transaction[]
    motifs: Motif[]
    settings: Settings[]
  }
}

export interface BackupSummary {
  exportedAt: string
  counts: {
    profiles: number
    users: number
    transactions: number
    motifs: number
    settings: number
  }
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupError'
  }
}

const transactionTypes = new Set(['CREDIT', 'DEBIT'])
const motifTypes = new Set(['CREDIT', 'DEBIT', 'BOTH'])
const userRoles = new Set(['PARENT', 'ENFANT'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new BackupError(`Format invalide: ${label} doit etre une chaine.`)
  }
  return value
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BackupError(`Format invalide: ${label} doit etre un nombre.`)
  }
  return value
}

function asBoolean(value: unknown, label: string, fallback?: boolean): boolean {
  if (typeof value === 'undefined') {
    if (typeof fallback === 'boolean') return fallback
    throw new BackupError(`Format invalide: ${label} doit etre un booleen.`)
  }
  if (typeof value !== 'boolean') {
    throw new BackupError(`Format invalide: ${label} doit etre un booleen.`)
  }
  return value
}

function parseDate(value: unknown, label: string): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new BackupError(`Format invalide: ${label} doit etre une date.`)
    }
    return date
  }
  throw new BackupError(`Format invalide: ${label} doit etre une date.`)
}

function parseOptionalDate(value: unknown, label: string): Date | undefined {
  if (value === undefined || value === null) return undefined
  return parseDate(value, label)
}

function ensureArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new BackupError(`Format invalide: ${label} doit etre un tableau.`)
  }
  return value
}

function normalizeProfiles(values: unknown[]): Profile[] {
  return values.map((value, index) => {
    if (!isRecord(value)) {
      throw new BackupError(`Format invalide: profiles[${index}] doit etre un objet.`)
    }
    return {
      id: asNumber(value.id, `profiles[${index}].id`),
      name: asString(value.name, `profiles[${index}].name`),
      color: asString(value.color, `profiles[${index}].color`),
      icon: asString(value.icon, `profiles[${index}].icon`),
      createdAt: parseDate(value.createdAt, `profiles[${index}].createdAt`),
      updatedAt: parseOptionalDate(value.updatedAt, `profiles[${index}].updatedAt`),
      archivedAt: parseOptionalDate(value.archivedAt, `profiles[${index}].archivedAt`),
    }
  })
}

function normalizeUsers(values: unknown[]): User[] {
  return values.map((value, index) => {
    if (!isRecord(value)) {
      throw new BackupError(`Format invalide: users[${index}] doit etre un objet.`)
    }
    const role = asString(value.role, `users[${index}].role`)
    if (!userRoles.has(role)) {
      throw new BackupError(`Format invalide: users[${index}].role invalide.`)
    }
    return {
      id: asNumber(value.id, `users[${index}].id`),
      name: asString(value.name, `users[${index}].name`),
      role: role as User['role'],
      profileId:
        typeof value.profileId === 'undefined'
          ? undefined
          : asNumber(value.profileId, `users[${index}].profileId`),
      createdAt: parseDate(value.createdAt, `users[${index}].createdAt`),
      updatedAt: parseOptionalDate(value.updatedAt, `users[${index}].updatedAt`),
    }
  })
}

function normalizeMotifs(values: unknown[]): Motif[] {
  return values.map((value, index) => {
    if (!isRecord(value)) {
      throw new BackupError(`Format invalide: motifs[${index}] doit etre un objet.`)
    }
    const type = asString(value.type, `motifs[${index}].type`)
    if (!motifTypes.has(type)) {
      throw new BackupError(`Format invalide: motifs[${index}].type invalide.`)
    }
    return {
      id: asNumber(value.id, `motifs[${index}].id`),
      label: asString(value.label, `motifs[${index}].label`),
      type: type as Motif['type'],
      icon: asString(value.icon, `motifs[${index}].icon`),
      isDefault: asBoolean(value.isDefault, `motifs[${index}].isDefault`),
      updatedAt: parseOptionalDate(value.updatedAt, `motifs[${index}].updatedAt`),
      archivedAt: parseOptionalDate(value.archivedAt, `motifs[${index}].archivedAt`),
    }
  })
}

function normalizeSettings(values: unknown[]): Settings[] {
  return values.map((value, index) => {
    if (!isRecord(value)) {
      throw new BackupError(`Format invalide: settings[${index}] doit etre un objet.`)
    }
    return {
      id: asNumber(value.id, `settings[${index}].id`),
      key: asString(value.key, `settings[${index}].key`),
      value: asString(value.value, `settings[${index}].value`),
    }
  })
}

function normalizeTransactions(values: unknown[]): Transaction[] {
  return values.map((value, index) => {
    if (!isRecord(value)) {
      throw new BackupError(`Format invalide: transactions[${index}] doit etre un objet.`)
    }
    const type = asString(value.type, `transactions[${index}].type`)
    if (!transactionTypes.has(type)) {
      throw new BackupError(`Format invalide: transactions[${index}].type invalide.`)
    }
    const description =
      typeof value.description === 'undefined'
        ? undefined
        : asString(value.description, `transactions[${index}].description`)
    return {
      id: asNumber(value.id, `transactions[${index}].id`),
      profileId: asNumber(value.profileId, `transactions[${index}].profileId`),
      amount: asNumber(value.amount, `transactions[${index}].amount`),
      type: type as Transaction['type'],
      motifId: asNumber(value.motifId, `transactions[${index}].motifId`),
      description,
      createdBy: asNumber(value.createdBy, `transactions[${index}].createdBy`),
      createdAt: parseDate(value.createdAt, `transactions[${index}].createdAt`),
      deletedAt: parseOptionalDate(value.deletedAt, `transactions[${index}].deletedAt`),
      linkedTransactionId:
        typeof value.linkedTransactionId === 'undefined'
          ? undefined
          : asNumber(value.linkedTransactionId, `transactions[${index}].linkedTransactionId`),
      hiddenForUsers: asBoolean(
        value.hiddenForUsers,
        `transactions[${index}].hiddenForUsers`,
        false
      ),
    }
  })
}

function normalizeBackupPayload(value: unknown): BackupPayload {
  if (!isRecord(value)) {
    throw new BackupError('Format de backup invalide.')
  }

  const schemaVersion = asNumber(value.schemaVersion, 'schemaVersion')
  if (schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupError(`Version de schema non supportee (${schemaVersion}). Version maximale supportee: ${BACKUP_SCHEMA_VERSION}.`)
  }
  // Accepter les versions antérieures pour rétrocompatibilité

  const exportedAt = asString(value.exportedAt, 'exportedAt')
  parseDate(exportedAt, 'exportedAt')

  const data = value.data
  if (!isRecord(data)) {
    throw new BackupError('Format invalide: data doit etre un objet.')
  }

  const profiles = normalizeProfiles(ensureArray(data.profiles, 'data.profiles'))
  const users = normalizeUsers(ensureArray(data.users, 'data.users'))
  const transactions = normalizeTransactions(
    ensureArray(data.transactions, 'data.transactions')
  )
  const motifs = normalizeMotifs(ensureArray(data.motifs, 'data.motifs'))
  const settings = normalizeSettings(ensureArray(data.settings, 'data.settings'))

  return {
    schemaVersion,
    exportedAt,
    data: {
      profiles,
      users,
      transactions,
      motifs,
      settings,
    },
  }
}

export function buildBackupFileName(date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10)
  return `argent-de-poche-backup-${isoDate}.json`
}

export function getBackupSummary(payload: BackupPayload): BackupSummary {
  return {
    exportedAt: payload.exportedAt,
    counts: {
      profiles: payload.data.profiles.length,
      users: payload.data.users.length,
      transactions: payload.data.transactions.length,
      motifs: payload.data.motifs.length,
      settings: payload.data.settings.length,
    },
  }
}

export class JsonExporter {
  static async exportPayload(): Promise<BackupPayload> {
    const [profiles, users, transactions, motifs, settings] = await Promise.all([
      db.profiles.toArray(),
      db.users.toArray(),
      db.transactions.toArray(),
      db.motifs.toArray(),
      db.settings.toArray(),
    ])

    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        profiles,
        users,
        transactions,
        motifs,
        settings,
      },
    }
  }

  static async exportToJson(): Promise<string> {
    const payload = await this.exportPayload()
    return JSON.stringify(payload, null, 2)
  }

  /**
   * Sprint 6: Export avec chiffrement optionnel
   */
  static async exportToJsonEncrypted(password: string): Promise<string> {
    const payload = await this.exportPayload()
    const jsonData = JSON.stringify(payload)
    const encrypted = await encryptBackup(jsonData, password)
    return JSON.stringify(encrypted, null, 2)
  }
}

async function mergeSettings(settings: Settings[]): Promise<void> {
  for (const setting of settings) {
    const existing = await db.settings.where('key').equals(setting.key).first()
    if (existing) {
      await db.settings.update(existing.id!, { value: setting.value })
    } else {
      await db.settings.add({ key: setting.key, value: setting.value })
    }
  }
}

export class JsonImporter {
  static parse(json: string): BackupPayload {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      throw new BackupError('Fichier JSON invalide.')
    }
    return normalizeBackupPayload(parsed)
  }

  /**
   * Sprint 6: Verifie si le fichier est chiffre
   */
  static isEncrypted(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      return isEncryptedBackup(parsed)
    } catch {
      return false
    }
  }

  /**
   * Sprint 6: Parse un fichier chiffre avec mot de passe
   */
  static async parseEncrypted(json: string, password: string): Promise<BackupPayload> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new BackupError('Fichier JSON invalide.')
    }

    if (!isEncryptedBackup(parsed)) {
      throw new BackupError('Le fichier n\'est pas chiffre.')
    }

    const decryptedJson = await decryptBackup(parsed as EncryptedBackup, password)
    return this.parse(decryptedJson)
  }

  static async importPayload(payload: unknown, mode: ImportMode): Promise<void> {
    const normalized = normalizeBackupPayload(payload)

    if (mode !== 'replace' && mode !== 'merge') {
      throw new BackupError("Mode d'import non supporte.")
    }

    await db.transaction(
      'rw',
      [db.profiles, db.users, db.transactions, db.motifs, db.settings],
      async () => {
        // Sauvegarder les settings locales à l'appareil AVANT le clear
        // (auth_mode, pin_hash, tokens Google, etc.)
        let localSettings: Settings[] = []
        if (mode === 'replace') {
          const allSettings = await db.settings.toArray()
          localSettings = allSettings.filter((s) => EXCLUDED_SETTINGS_KEYS.has(s.key))
        }

        if (mode === 'replace') {
          await Promise.all([
            db.profiles.clear(),
            db.users.clear(),
            db.transactions.clear(),
            db.motifs.clear(),
            db.settings.clear(),
          ])
        }

        await db.profiles.bulkPut(normalized.data.profiles)
        await db.users.bulkPut(normalized.data.users)
        await db.transactions.bulkPut(normalized.data.transactions)
        await db.motifs.bulkPut(normalized.data.motifs)

        if (mode === 'replace') {
          // Filtrer les settings locales du backup (on ne veut pas les écraser)
          const filteredSettings = normalized.data.settings.filter(
            (s) => !EXCLUDED_SETTINGS_KEYS.has(s.key)
          )
          await db.settings.bulkPut(filteredSettings)
          // Restaurer les settings locales préservées
          if (localSettings.length > 0) {
            await db.settings.bulkPut(localSettings)
          }
        } else {
          await mergeSettings(normalized.data.settings)
        }
      }
    )
  }
}
