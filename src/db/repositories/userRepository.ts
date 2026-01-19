import { db, type User } from '../database'

export const userRepository = {
  async getAll(): Promise<User[]> {
    return db.users.toArray()
  },

  async getById(id: number): Promise<User | undefined> {
    return db.users.get(id)
  },

  async getByRole(role: 'PARENT' | 'ENFANT'): Promise<User[]> {
    return db.users.where('role').equals(role).toArray()
  },

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date()
    const id = await db.users.add({
      ...user,
      createdAt: now,
      updatedAt: now,
    })
    return id as number
  },

  async update(id: number, changes: Partial<User>): Promise<number> {
    return db.users.update(id, {
      ...changes,
      updatedAt: new Date(),
    })
  },

  async delete(id: number): Promise<void> {
    await db.users.delete(id)
  },

  async getParents(): Promise<User[]> {
    return this.getByRole('PARENT')
  },

  async getChildren(): Promise<User[]> {
    return this.getByRole('ENFANT')
  },
}
