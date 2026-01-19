import { db } from './database'
import { settingsRepository } from './repositories/settingsRepository'

const SEED_KEY = 'db_seeded'

const defaultProfiles = [
  { name: 'Enora', color: '#ec4899', icon: '👧' },
  { name: 'Martin', color: '#3b82f6', icon: '👦' },
]

const defaultUsers = [
  { name: 'Camille', role: 'PARENT' as const },
  { name: 'Emeline', role: 'PARENT' as const },
]

const defaultMotifs = [
  { label: 'Argent de poche', type: 'CREDIT' as const, icon: '💰', isDefault: true },
  { label: 'Cadeau', type: 'CREDIT' as const, icon: '🎁', isDefault: true },
  { label: 'Anniversaire', type: 'CREDIT' as const, icon: '🎂', isDefault: true },
  { label: 'Récompense', type: 'CREDIT' as const, icon: '⭐', isDefault: true },
  { label: 'Autre entrée', type: 'CREDIT' as const, icon: '➕', isDefault: true },
  { label: 'Achat', type: 'DEBIT' as const, icon: '🛒', isDefault: true },
  { label: 'Jouet', type: 'DEBIT' as const, icon: '🧸', isDefault: true },
  { label: 'Friandise', type: 'DEBIT' as const, icon: '🍬', isDefault: true },
  { label: 'Jeu vidéo', type: 'DEBIT' as const, icon: '🎮', isDefault: true },
  { label: 'Autre dépense', type: 'DEBIT' as const, icon: '➖', isDefault: true },
]

export async function seedDatabase(): Promise<boolean> {
  const isSeeded = await settingsRepository.get(SEED_KEY)

  if (isSeeded === 'true') {
    return false
  }

  await db.transaction('rw', [db.profiles, db.users, db.motifs, db.settings], async () => {
    const profileIds: number[] = []

    for (const profile of defaultProfiles) {
      const id = await db.profiles.add({
        ...profile,
        createdAt: new Date(),
      })
      profileIds.push(id as number)
    }

    for (const user of defaultUsers) {
      await db.users.add({
        ...user,
        createdAt: new Date(),
      })
    }

    for (let i = 0; i < defaultProfiles.length; i++) {
      await db.users.add({
        name: defaultProfiles[i].name,
        role: 'ENFANT',
        profileId: profileIds[i],
        createdAt: new Date(),
      })
    }

    for (const motif of defaultMotifs) {
      await db.motifs.add(motif)
    }

    await settingsRepository.set(SEED_KEY, 'true')
  })

  return true
}

export async function isFirstLaunch(): Promise<boolean> {
  const isSeeded = await settingsRepository.get(SEED_KEY)
  return isSeeded !== 'true'
}
