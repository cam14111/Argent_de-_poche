import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import {
  setAllowanceConfig,
  applyPendingPayments,
  getPendingPayments,
  ALLOWANCE_DESCRIPTION,
} from './allowance'

async function seedBaseData(): Promise<number> {
  const profileId = (await db.profiles.add({
    name: 'Test',
    color: '#000',
    icon: '🧒',
    createdAt: new Date(),
  })) as number
  await db.users.add({ name: 'Parent', role: 'PARENT', createdAt: new Date() })
  await db.motifs.add({
    label: 'Argent de poche',
    type: 'CREDIT',
    icon: '💰',
    isDefault: true,
  })
  return profileId
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => {
  db.close()
})

describe('applyPendingPayments (integration)', () => {
  it('creates due credits and advances lastAppliedAt', async () => {
    const profileId = await seedBaseData()
    // Configuré il y a plusieurs semaines : versements en retard.
    await setAllowanceConfig(profileId, {
      amount: 5,
      frequency: 'weekly',
      dayOfWeek: 6,
      enabled: true,
      lastAppliedAt: '2026-01-01T12:00:00.000Z',
    })

    const now = new Date('2026-01-25T12:00:00.000Z')
    const created = await applyPendingPayments(now)
    expect(created).toBeGreaterThan(0)

    const credits = await db.transactions
      .filter((t) => t.description === ALLOWANCE_DESCRIPTION)
      .toArray()
    expect(credits.length).toBe(created)
    expect(credits.every((t) => t.type === 'CREDIT' && t.amount === 5)).toBe(true)

    // Plus aucun versement en attente après application.
    const pendingAfter = await getPendingPayments(now)
    expect(pendingAfter).toHaveLength(0)
  })

  it('is idempotent: re-applying at the same instant creates nothing new', async () => {
    const profileId = await seedBaseData()
    await setAllowanceConfig(profileId, {
      amount: 5,
      frequency: 'weekly',
      dayOfWeek: 6,
      enabled: true,
      lastAppliedAt: '2026-01-01T12:00:00.000Z',
    })

    const now = new Date('2026-01-25T12:00:00.000Z')
    const first = await applyPendingPayments(now)
    const second = await applyPendingPayments(now)

    expect(second).toBe(0)
    const credits = await db.transactions
      .filter((t) => t.description === ALLOWANCE_DESCRIPTION)
      .count()
    expect(credits).toBe(first)
  })

  it('does not recreate a payment already present for the same day', async () => {
    const profileId = await seedBaseData()
    await setAllowanceConfig(profileId, {
      amount: 5,
      frequency: 'weekly',
      dayOfWeek: 6,
      enabled: true,
      lastAppliedAt: '2026-01-09T12:00:00.000Z',
    })
    // Simule un versement déjà fait le 10/01 (échec partiel précédent qui
    // n'aurait pas avancé lastAppliedAt).
    const motif = await db.motifs.toCollection().first()
    await db.transactions.add({
      profileId,
      amount: 5,
      type: 'CREDIT',
      motifId: motif!.id!,
      description: ALLOWANCE_DESCRIPTION,
      createdBy: 1,
      createdAt: new Date('2026-01-10T12:00:00.000Z'),
    })

    const now = new Date('2026-01-11T12:00:00.000Z')
    const created = await applyPendingPayments(now)
    // Le 10/01 (samedi) existe déjà : rien de nouveau.
    expect(created).toBe(0)
    const count = await db.transactions
      .filter((t) => t.description === ALLOWANCE_DESCRIPTION)
      .count()
    expect(count).toBe(1)
  })
})
