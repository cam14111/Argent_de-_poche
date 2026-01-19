import { db, type Transaction } from '../database'
import { autoSyncService } from '@/lib/sync'

export const transactionRepository = {
  async getAll(includeDeleted = false): Promise<Transaction[]> {
    const txs = await db.transactions.orderBy('createdAt').reverse().toArray()
    return includeDeleted ? txs : txs.filter((tx) => !tx.deletedAt)
  },

  async getByProfileId(
    profileId: number,
    includeDeleted = false
  ): Promise<Transaction[]> {
    const txs = await db.transactions
      .where('profileId')
      .equals(profileId)
      .reverse()
      .sortBy('createdAt')
    return includeDeleted ? txs : txs.filter((tx) => !tx.deletedAt)
  },

  async getById(id: number): Promise<Transaction | undefined> {
    return db.transactions.get(id)
  },

  async create(
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<number> {
    const id = await db.transactions.add({
      ...transaction,
      createdAt: new Date(),
    })
    autoSyncService.markDirty()
    return id as number
  },

  async update(id: number, changes: Partial<Transaction>): Promise<number> {
    const result = await db.transactions.update(id, changes)
    autoSyncService.markDirty()
    return result
  },

  async softDelete(id: number): Promise<void> {
    await db.transactions.update(id, { deletedAt: new Date() })
    autoSyncService.markDirty()
  },

  async getRecentByProfile(
    profileId: number,
    limit: number = 10
  ): Promise<Transaction[]> {
    return db.transactions
      .where('profileId')
      .equals(profileId)
      .reverse()
      .sortBy('createdAt')
      .then((txs) => txs.slice(0, limit))
  },

  async getByProfileIdFiltered(
    profileId: number,
    options: {
      type?: 'CREDIT' | 'DEBIT'
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<Transaction[]> {
    let txs = await this.getByProfileId(profileId, false)

    if (options.type) {
      txs = txs.filter((tx) => tx.type === options.type)
    }

    if (options.startDate) {
      txs = txs.filter((tx) => tx.createdAt >= options.startDate!)
    }

    if (options.endDate) {
      txs = txs.filter((tx) => tx.createdAt <= options.endDate!)
    }

    const offset = options.offset || 0
    const limit = options.limit || txs.length

    return txs.slice(offset, offset + limit)
  },

  async createCorrection(
    originalId: number,
    correctionType: 'CANCEL' | 'ADJUST',
    userId: number,
    newAmount?: number
  ): Promise<number> {
    const original = await this.getById(originalId)
    if (!original) throw new Error('Transaction originale introuvable')
    if (original.linkedTransactionId)
      throw new Error('Transaction déjà corrigée')

    let correctionAmount: number
    let type: 'CREDIT' | 'DEBIT'

    if (correctionType === 'CANCEL') {
      // Pour annuler une transaction, on inverse le type
      correctionAmount = original.amount
      type = original.type === 'DEBIT' ? 'CREDIT' : 'DEBIT'
    } else {
      // Pour un ajustement
      const difference = newAmount! - original.amount

      if (original.type === 'DEBIT') {
        // Si la transaction originale est un débit
        if (difference > 0) {
          // Augmenter le débit : ajouter un débit
          type = 'DEBIT'
          correctionAmount = difference
        } else {
          // Réduire le débit : ajouter un crédit
          type = 'CREDIT'
          correctionAmount = Math.abs(difference)
        }
      } else {
        // Si la transaction originale est un crédit
        if (difference > 0) {
          // Augmenter le crédit : ajouter un crédit
          type = 'CREDIT'
          correctionAmount = difference
        } else {
          // Réduire le crédit : ajouter un débit
          type = 'DEBIT'
          correctionAmount = Math.abs(difference)
        }
      }
    }

    const correctionId = await this.create({
      profileId: original.profileId,
      amount: correctionAmount,
      type,
      motifId: original.motifId,
      description: `Correction: ${original.description || 'Transaction corrigée'}`,
      createdBy: userId,
      linkedTransactionId: originalId,
      hiddenForUsers: original.hiddenForUsers,
    })

    await this.update(originalId, { linkedTransactionId: correctionId })

    return correctionId
  },

  async getLinkedTransaction(id: number): Promise<Transaction | undefined> {
    const tx = await this.getById(id)
    if (!tx?.linkedTransactionId) return undefined
    return this.getById(tx.linkedTransactionId)
  },
}
