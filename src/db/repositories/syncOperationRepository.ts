import { db, type SyncOperation } from '../database'

export const syncOperationRepository = {
  async getAll(): Promise<SyncOperation[]> {
    return db.syncOperations.toArray()
  },

  async getById(id: number): Promise<SyncOperation | undefined> {
    return db.syncOperations.get(id)
  },

  async create(
    operation: Omit<SyncOperation, 'id' | 'createdAt'>
  ): Promise<number> {
    const id = await db.syncOperations.add({
      ...operation,
      createdAt: new Date(),
    })
    return id as number
  },

  async update(id: number, changes: Partial<SyncOperation>): Promise<number> {
    return db.syncOperations.update(id, changes)
  },

  async delete(id: number): Promise<void> {
    await db.syncOperations.delete(id)
  },

  /**
   * Récupère toutes les opérations en attente
   */
  async getPending(): Promise<SyncOperation[]> {
    const now = new Date()
    return db.syncOperations
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .filter((op) => !op.nextRetryAt || op.nextRetryAt <= now)
      .toArray()
  },

  /**
   * Récupère le nombre d'opérations en attente
   */
  async getPendingCount(): Promise<number> {
    return db.syncOperations.where('status').equals('PENDING').count()
  },

  /**
   * Récupère le nombre d'opérations échouées
   */
  async getFailedCount(): Promise<number> {
    return db.syncOperations.where('status').equals('FAILED').count()
  },

  /**
   * Supprime toutes les opérations complétées
   */
  async clearCompleted(): Promise<number> {
    return db.syncOperations.where('status').equals('COMPLETED').delete()
  },

  /**
   * Supprime toutes les opérations (utile pour réinitialisation)
   */
  async clearAll(): Promise<void> {
    await db.syncOperations.clear()
  },

  /**
   * Récupère la dernière opération réussie d'un type donné
   */
  async getLastCompleted(
    type: 'BACKUP' | 'RESTORE'
  ): Promise<SyncOperation | undefined> {
    const ops = await db.syncOperations
      .where('status')
      .equals('COMPLETED')
      .and((op) => op.type === type)
      .reverse()
      .sortBy('createdAt')

    return ops[0]
  },
}
