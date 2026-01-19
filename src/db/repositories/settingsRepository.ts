import { db, type Settings } from '../database'

export const settingsRepository = {
  async get(key: string): Promise<string | undefined> {
    const setting = await db.settings.where('key').equals(key).first()
    return setting?.value
  },

  async set(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first()
    if (existing) {
      await db.settings.update(existing.id!, { value })
    } else {
      await db.settings.add({ key, value })
    }
  },

  async delete(key: string): Promise<void> {
    await db.settings.where('key').equals(key).delete()
  },

  async getAll(): Promise<Settings[]> {
    return db.settings.toArray()
  },
}
