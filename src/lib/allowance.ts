/**
 * Argent de poche récurrent.
 *
 * La configuration est stockée dans la table `settings` (clé JSON), donc
 * elle est incluse dans les backups et synchronisée entre appareils sans
 * changement de schéma. Les versements ne sont jamais créés automatiquement
 * en arrière-plan : l'application calcule les versements « dus » et les
 * propose au parent, qui les applique en un clic. Cela évite les doublons
 * entre appareils de co-parents et garde le parent aux commandes.
 */

import { settingsRepository, transactionRepository, motifRepository, userRepository } from '@/db'
import { roundCents } from './money'

export const ALLOWANCE_CONFIG_KEY = 'allowance_config_v1'

/** Nombre maximal de versements de rattrapage proposés d'un coup. */
const MAX_CATCH_UP = 8

export interface AllowanceConfig {
  /** Montant du versement en euros. */
  amount: number
  /** Fréquence du versement. */
  frequency: 'weekly' | 'monthly'
  /** Jour de la semaine (0 = dimanche … 6 = samedi) pour weekly. */
  dayOfWeek?: number
  /** Jour du mois (1-28) pour monthly. */
  dayOfMonth?: number
  /** Date ISO du dernier versement appliqué (borne de départ du calcul). */
  lastAppliedAt: string
  enabled: boolean
}

export type AllowanceConfigMap = Record<string, AllowanceConfig>

export interface PendingPayment {
  profileId: number
  dueDate: Date
  amount: number
}

export async function getAllowanceConfigs(): Promise<AllowanceConfigMap> {
  const raw = await settingsRepository.get(ALLOWANCE_CONFIG_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as AllowanceConfigMap
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export async function setAllowanceConfig(
  profileId: number,
  config: AllowanceConfig | null
): Promise<void> {
  const configs = await getAllowanceConfigs()
  if (config === null) {
    delete configs[String(profileId)]
  } else {
    configs[String(profileId)] = {
      ...config,
      amount: roundCents(config.amount),
    }
  }
  await settingsRepository.set(ALLOWANCE_CONFIG_KEY, JSON.stringify(configs))
}

/**
 * Calcule les dates de versement dues pour une configuration donnée,
 * strictement après `lastAppliedAt` et jusqu'à `now` inclus.
 * Fonction pure pour être testable.
 */
export function computeDueDates(config: AllowanceConfig, now: Date): Date[] {
  if (!config.enabled || config.amount <= 0) return []

  const lastApplied = new Date(config.lastAppliedAt)
  if (Number.isNaN(lastApplied.getTime())) return []

  const due: Date[] = []

  if (config.frequency === 'weekly') {
    const targetDay = config.dayOfWeek ?? 6 // samedi par défaut
    // Première occurrence STRICTEMENT après lastApplied
    const cursor = new Date(lastApplied)
    cursor.setHours(12, 0, 0, 0)
    do {
      cursor.setDate(cursor.getDate() + 1)
    } while (cursor.getDay() !== targetDay)

    while (cursor <= now && due.length < MAX_CATCH_UP) {
      due.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
  } else {
    const targetDay = Math.min(Math.max(config.dayOfMonth ?? 1, 1), 28)
    const cursor = new Date(lastApplied.getFullYear(), lastApplied.getMonth(), targetDay, 12, 0, 0, 0)
    if (cursor <= lastApplied) {
      cursor.setMonth(cursor.getMonth() + 1)
    }
    while (cursor <= now && due.length < MAX_CATCH_UP) {
      due.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  return due
}

/**
 * Liste tous les versements en attente, tous profils confondus.
 */
export async function getPendingPayments(now = new Date()): Promise<PendingPayment[]> {
  const configs = await getAllowanceConfigs()
  const pending: PendingPayment[] = []

  for (const [profileIdRaw, config] of Object.entries(configs)) {
    const profileId = Number.parseInt(profileIdRaw, 10)
    if (!Number.isFinite(profileId)) continue
    for (const dueDate of computeDueDates(config, now)) {
      pending.push({ profileId, dueDate, amount: roundCents(config.amount) })
    }
  }

  return pending.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Applique tous les versements en attente : crée les transactions CREDIT
 * (motif « Argent de poche ») et avance `lastAppliedAt` pour chaque profil.
 * Retourne le nombre de versements créés.
 */
export async function applyPendingPayments(now = new Date()): Promise<number> {
  const pending = await getPendingPayments(now)
  if (pending.length === 0) return 0

  const motifs = await motifRepository.getActive()
  const allowanceMotif =
    motifs.find((m) => m.label.toLowerCase().includes('argent de poche')) ??
    motifs.find((m) => m.type === 'CREDIT' || m.type === 'BOTH')
  if (!allowanceMotif?.id) {
    throw new Error('Aucun motif de crédit disponible pour le versement')
  }

  const parents = await userRepository.getParents()
  const createdBy = parents[0]?.id
  if (!createdBy) {
    throw new Error('Aucun parent trouvé')
  }

  const lastByProfile = new Map<number, Date>()
  for (const payment of pending) {
    await transactionRepository.create({
      profileId: payment.profileId,
      amount: payment.amount,
      type: 'CREDIT',
      motifId: allowanceMotif.id,
      description: 'Argent de poche automatique',
      createdBy,
      createdAt: payment.dueDate,
      hiddenForUsers: false,
    })
    const current = lastByProfile.get(payment.profileId)
    if (!current || payment.dueDate > current) {
      lastByProfile.set(payment.profileId, payment.dueDate)
    }
  }

  const configs = await getAllowanceConfigs()
  for (const [profileId, lastDate] of lastByProfile) {
    const config = configs[String(profileId)]
    if (config) {
      config.lastAppliedAt = lastDate.toISOString()
    }
  }
  await settingsRepository.set(ALLOWANCE_CONFIG_KEY, JSON.stringify(configs))

  return pending.length
}
