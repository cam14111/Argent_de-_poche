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
    // Normaliser le jour cible dans [0, 6]. Une valeur invalide (NaN, 7, -1)
    // issue d'un JSON corrompu ou d'un futur writer ferait tourner la boucle
    // do/while à l'infini car Date.getDay() ne renvoie jamais > 6.
    const rawDay = config.dayOfWeek ?? 6 // samedi par défaut
    const targetDay = Number.isInteger(rawDay) ? ((rawDay % 7) + 7) % 7 : 6
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

/** Marqueur de description des versements automatiques (sert à la dédup). */
export const ALLOWANCE_DESCRIPTION = 'Argent de poche automatique'

/** Clé de déduplication : un versement par profil et par jour d'échéance. */
function paymentKey(profileId: number, date: Date): string {
  return `${profileId}|${date.toISOString().slice(0, 10)}`
}

/**
 * Applique les versements en attente : crée les transactions CREDIT (motif
 * « Argent de poche ») et avance `lastAppliedAt` par profil.
 *
 * Robustesse :
 * - idempotent : un versement déjà présent (même profil + même jour +
 *   marqueur) n'est pas recréé, ce qui protège des ré-exécutions après un
 *   échec partiel et des ré-applications sur le même appareil ;
 * - progression persistée après CHAQUE création : si une création échoue en
 *   cours de route, les versements déjà faits ne seront pas recréés.
 *
 * Limite connue : deux co-parents appliquant hors-ligne avant synchronisation
 * peuvent encore produire un doublon (les ids de transactions sont propres à
 * chaque appareil et l'union de merge les conserve tous les deux).
 *
 * Retourne le nombre de versements réellement créés.
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

  // Index des versements automatiques déjà enregistrés (dédup locale).
  const existing = await transactionRepository.getAll(true)
  const existingKeys = new Set(
    existing
      .filter((t) => t.description === ALLOWANCE_DESCRIPTION)
      .map((t) => paymentKey(t.profileId, new Date(t.createdAt)))
  )

  const configs = await getAllowanceConfigs()
  let created = 0

  // `pending` est trié par date croissante, donc lastAppliedAt avance de façon
  // monotone. On persiste après chaque création réussie.
  for (const payment of pending) {
    const key = paymentKey(payment.profileId, payment.dueDate)
    if (!existingKeys.has(key)) {
      await transactionRepository.create({
        profileId: payment.profileId,
        amount: payment.amount,
        type: 'CREDIT',
        motifId: allowanceMotif.id,
        description: ALLOWANCE_DESCRIPTION,
        createdBy,
        createdAt: payment.dueDate,
        hiddenForUsers: false,
      })
      existingKeys.add(key)
      created += 1
    }

    const config = configs[String(payment.profileId)]
    if (config) {
      const prev = new Date(config.lastAppliedAt).getTime()
      if (Number.isNaN(prev) || payment.dueDate.getTime() > prev) {
        config.lastAppliedAt = payment.dueDate.toISOString()
        await settingsRepository.set(ALLOWANCE_CONFIG_KEY, JSON.stringify(configs))
      }
    }
  }

  return created
}
