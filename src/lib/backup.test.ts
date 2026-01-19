import { beforeEach, describe, expect, it, afterEach } from 'vitest'
import { db } from '@/db'
import {
  BACKUP_SCHEMA_VERSION,
  BackupError,
  JsonExporter,
  JsonImporter,
} from './backup'

const basePayload = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2025-01-01T08:00:00.000Z',
  data: {
    profiles: [
      {
        id: 1,
        name: 'Enfant',
        color: '#ffffff',
        icon: '*',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ],
    users: [
      {
        id: 1,
        name: 'Parent',
        role: 'PARENT',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 1,
        profileId: 1,
        amount: 10,
        type: 'CREDIT',
        motifId: 1,
        description: 'Test',
        createdBy: 1,
        createdAt: '2025-01-02T08:00:00.000Z',
        deletedAt: null,
        linkedTransactionId: undefined,
        hiddenForUsers: false,
      },
    ],
    motifs: [
      {
        id: 1,
        label: 'Cadeau',
        type: 'CREDIT',
        icon: '*',
        isDefault: false,
      },
    ],
    settings: [
      {
        id: 1,
        key: 'pin_hash',
        value: 'abc123',
      },
    ],
  },
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => {
  db.close()
})

describe('backup import/export', () => {
  it('exports all tables with schema version', async () => {
    const profileId = (await db.profiles.add({
      name: 'Lea',
      color: '#000000',
      icon: '*',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
    })) as number

    const userId = (await db.users.add({
      name: 'Parent',
      role: 'PARENT',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
    })) as number

    const motifId = (await db.motifs.add({
      label: 'Cadeau',
      type: 'CREDIT',
      icon: '*',
      isDefault: false,
    })) as number

    await db.transactions.add({
      profileId,
      amount: 20,
      type: 'CREDIT',
      motifId,
      description: 'Anniversaire',
      createdBy: userId,
      createdAt: new Date('2025-01-02T10:00:00.000Z'),
    })

    await db.settings.add({ key: 'pin_hash', value: 'hash' })

    const payload = await JsonExporter.exportPayload()

    expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(payload.data.profiles).toHaveLength(1)
    expect(payload.data.users).toHaveLength(1)
    expect(payload.data.transactions).toHaveLength(1)
    expect(payload.data.motifs).toHaveLength(1)
    expect(payload.data.settings).toHaveLength(1)
  })

  it('imports data in replace mode', async () => {
    await db.profiles.add({
      name: 'Ancien',
      color: '#111111',
      icon: '*',
      createdAt: new Date('2025-01-01T09:00:00.000Z'),
    })

    await JsonImporter.importPayload(basePayload, 'replace')

    const profiles = await db.profiles.toArray()
    const transactions = await db.transactions.toArray()

    expect(profiles).toHaveLength(1)
    expect(profiles[0].name).toBe('Enfant')
    expect(transactions).toHaveLength(1)
  })

  it('merges data without duplicates and updates settings by key', async () => {
    await db.settings.add({ key: 'pin_hash', value: 'old' })
    await db.profiles.add({
      id: 1,
      name: 'Ancien',
      color: '#111111',
      icon: '*',
      createdAt: new Date('2025-01-01T09:00:00.000Z'),
    })

    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        profiles: [
          {
            id: 1,
            name: 'Enfant',
            color: '#ffffff',
            icon: '*',
            createdAt: '2025-01-01T08:00:00.000Z',
          },
        ],
        settings: [
          {
            id: 99,
            key: 'pin_hash',
            value: 'new',
          },
        ],
      },
    }

    await JsonImporter.importPayload(payload, 'merge')

    const profiles = await db.profiles.toArray()
    const settings = await db.settings.toArray()

    expect(profiles).toHaveLength(1)
    expect(profiles[0].name).toBe('Enfant')
    expect(settings).toHaveLength(1)
    expect(settings[0].value).toBe('new')
  })

  it('rejects unsupported schema versions', () => {
    const invalid = JSON.stringify({
      ...basePayload,
      schemaVersion: 999,
    })

    expect(() => JsonImporter.parse(invalid)).toThrow(BackupError)
  })
})
