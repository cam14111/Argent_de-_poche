import { db, type Motif } from '../database'
import { autoSyncService } from '@/lib/sync'

export const motifRepository = {
  async getAll(): Promise<Motif[]> {
    return db.motifs.toArray()
  },

  async getById(id: number): Promise<Motif | undefined> {
    return db.motifs.get(id)
  },

  async getByType(type: 'CREDIT' | 'DEBIT'): Promise<Motif[]> {
    return db.motifs
      .filter((m) => m.type === type || m.type === 'BOTH')
      .toArray()
  },

  async create(motif: Omit<Motif, 'id' | 'updatedAt' | 'archivedAt'>): Promise<number> {
    const id = await db.motifs.add({
      ...motif,
      updatedAt: new Date(),
      archivedAt: undefined,
    })
    autoSyncService.markDirty()
    return id as number
  },

  async update(id: number, changes: Partial<Motif>): Promise<number> {
    const result = await db.motifs.update(id, {
      ...changes,
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },

  async delete(id: number): Promise<void> {
    await db.motifs.delete(id)
    autoSyncService.markDirty()
  },

  async getDefaults(): Promise<Motif[]> {
    return db.motifs.filter((m) => m.isDefault).toArray()
  },

  // Sprint 6: Nouvelles méthodes pour l'archivage
  async getActive(): Promise<Motif[]> {
    return db.motifs.filter((m) => !m.archivedAt).toArray()
  },

  async getActiveByType(type: 'CREDIT' | 'DEBIT'): Promise<Motif[]> {
    return db.motifs
      .filter((m) => !m.archivedAt && (m.type === type || m.type === 'BOTH'))
      .toArray()
  },

  async getArchived(): Promise<Motif[]> {
    return db.motifs.filter((m) => !!m.archivedAt).toArray()
  },

  async archive(id: number): Promise<number> {
    const motif = await db.motifs.get(id)
    if (!motif) {
      throw new Error('Motif non trouvé')
    }
    if (motif.isDefault) {
      throw new Error('Les motifs système ne peuvent pas être archivés')
    }
    const result = await db.motifs.update(id, {
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },

  async restore(id: number): Promise<number> {
    const motif = await db.motifs.get(id)
    if (!motif) {
      throw new Error('Motif non trouvé')
    }
    const result = await db.motifs.update(id, {
      archivedAt: undefined,
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },

  async rename(id: number, newLabel: string): Promise<number> {
    const motif = await db.motifs.get(id)
    if (!motif) {
      throw new Error('Motif non trouvé')
    }
    if (!newLabel.trim()) {
      throw new Error('Le libellé ne peut pas être vide')
    }
    const result = await db.motifs.update(id, {
      label: newLabel.trim(),
      updatedAt: new Date(),
    })
    autoSyncService.markDirty()
    return result
  },
}
