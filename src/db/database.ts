import Dexie, { type EntityTable } from 'dexie'

export interface Profile {
  id?: number
  name: string
  color: string
  icon: string
  createdAt: Date
  updatedAt?: Date
  archivedAt?: Date
}

export interface User {
  id?: number
  name: string
  role: 'PARENT' | 'ENFANT'
  profileId?: number
  createdAt: Date
  updatedAt?: Date
}

export interface Transaction {
  id?: number
  profileId: number
  amount: number
  type: 'CREDIT' | 'DEBIT'
  motifId: number
  description?: string
  createdBy: number
  createdAt: Date
  deletedAt?: Date
  linkedTransactionId?: number
  hiddenForUsers?: boolean
}

export interface Motif {
  id?: number
  label: string
  type: 'CREDIT' | 'DEBIT' | 'BOTH'
  icon: string
  isDefault: boolean
  updatedAt?: Date
  archivedAt?: Date
}

export interface Settings {
  id?: number
  key: string
  value: string
}

export interface SyncOperation {
  id?: number
  type: 'BACKUP' | 'RESTORE'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  payload?: string
  error?: string
  createdAt: Date
  attempts: number
  maxAttempts: number
  nextRetryAt?: Date
}

class ArgentDePocheDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>
  users!: EntityTable<User, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  motifs!: EntityTable<Motif, 'id'>
  settings!: EntityTable<Settings, 'id'>
  syncOperations!: EntityTable<SyncOperation, 'id'>

  constructor() {
    super('ArgentDePocheDB')

    this.version(1).stores({
      profiles: '++id, name',
      users: '++id, name, role, profileId',
      transactions: '++id, profileId, type, motifId, createdAt',
      motifs: '++id, label, type',
      settings: '++id, &key',
    })

    this.version(2)
      .stores({
        profiles: '++id, name',
        users: '++id, name, role, profileId',
        transactions:
          '++id, profileId, type, motifId, createdAt, deletedAt, linkedTransactionId',
        motifs: '++id, label, type',
        settings: '++id, &key',
      })
      .upgrade((tx) => {
        return tx
          .table('transactions')
          .toCollection()
          .modify((t: any) => {
            if (!('deletedAt' in t)) t.deletedAt = undefined
            if (!('linkedTransactionId' in t))
              t.linkedTransactionId = undefined
            if (!('hiddenForUsers' in t)) t.hiddenForUsers = false
          })
      })

    this.version(3)
      .stores({
        profiles: '++id, name',
        users: '++id, name, role, profileId',
        transactions:
          '++id, profileId, type, motifId, createdAt, deletedAt, linkedTransactionId',
        motifs: '++id, label, type',
        settings: '++id, &key',
        syncOperations: '++id, status, nextRetryAt',
      })
      .upgrade((tx) => {
        return Promise.all([
          tx
            .table('profiles')
            .toCollection()
            .modify((p: any) => {
              if (!('updatedAt' in p)) p.updatedAt = p.createdAt
            }),
          tx
            .table('users')
            .toCollection()
            .modify((u: any) => {
              if (!('updatedAt' in u)) u.updatedAt = u.createdAt
            }),
          tx
            .table('motifs')
            .toCollection()
            .modify((m: any) => {
              if (!('updatedAt' in m)) m.updatedAt = m.createdAt
            }),
        ])
      })

    // Sprint 6: Migration v4 - Archivage des profils et motifs + index optimisés
    this.version(4)
      .stores({
        profiles: '++id, name, archivedAt',
        users: '++id, name, role, profileId',
        transactions:
          '++id, profileId, type, motifId, createdAt, deletedAt, linkedTransactionId, [profileId+createdAt]',
        motifs: '++id, label, type, archivedAt',
        settings: '++id, &key',
        syncOperations: '++id, status, nextRetryAt',
      })
      .upgrade((tx) => {
        return Promise.all([
          tx
            .table('profiles')
            .toCollection()
            .modify((p: any) => {
              if (!('archivedAt' in p)) p.archivedAt = undefined
            }),
          tx
            .table('motifs')
            .toCollection()
            .modify((m: any) => {
              if (!('archivedAt' in m)) m.archivedAt = undefined
            }),
        ])
      })
  }
}

export const db = new ArgentDePocheDB()
