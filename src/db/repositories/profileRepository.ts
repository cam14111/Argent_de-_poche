import { db, type Profile } from '../database'
import { autoSyncService } from '@/lib/sync'

export const profileRepository = {
  async getAll(): Promise<Profile[]> {
    return db.profiles.toArray()
  },

  async getById(id: number): Promise<Profile | undefined> {
    return db.profiles.get(id)
  },

  async create(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>): Promise<number> {
    const now = new Date()
    const id = await db.profiles.add({
      ...profile,
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined,
    })
    autoSyncService.markDirty()
    return id as number
  },

  async update(id: number, changes: Partial<Profile>): Promise<number> {
    const result = await db.profiles.update(id, {
      ...changes,
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },

  async delete(id: number): Promise<void> {
    await db.profiles.delete(id)
    autoSyncService.markDirty()
  },

  async getBalance(profileId: number): Promise<number> {
    const transactions = await db.transactions
      .where('profileId')
      .equals(profileId)
      .toArray()

    const activeTransactions = transactions.filter((tx) => !tx.deletedAt)

    return activeTransactions.reduce((acc, tx) => {
      return tx.type === 'CREDIT' ? acc + tx.amount : acc - tx.amount
    }, 0)
  },

  // Sprint 6: Nouvelles méthodes pour l'archivage
  async getActive(): Promise<Profile[]> {
    return db.profiles.filter((p) => !p.archivedAt).toArray()
  },

  async getArchived(): Promise<Profile[]> {
    return db.profiles.filter((p) => !!p.archivedAt).toArray()
  },

  async archive(id: number): Promise<number> {
    const profile = await db.profiles.get(id)
    if (!profile) {
      throw new Error('Profil non trouvé')
    }
    const result = await db.profiles.update(id, {
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },

  async restore(id: number): Promise<number> {
    const profile = await db.profiles.get(id)
    if (!profile) {
      throw new Error('Profil non trouvé')
    }
    const result = await db.profiles.update(id, {
      archivedAt: undefined,
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },
}
