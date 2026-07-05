/**
 * Objectifs d'épargne par enfant.
 *
 * Comme la configuration d'argent de poche, les objectifs sont stockés dans
 * la table `settings` (clé JSON). Ils sont donc inclus dans les backups et
 * synchronisés entre appareils sans nouvelle table ni migration de schéma,
 * ce qui garde la logique de merge existante intacte.
 *
 * La progression d'un objectif est calculée à partir du solde courant de
 * l'enfant : rien n'est « bloqué », l'objectif est purement motivationnel.
 */

import { settingsRepository } from '@/db'
import { roundCents } from './money'

export const GOALS_KEY = 'savings_goals_v1'

export interface SavingsGoal {
  id: string
  profileId: number
  name: string
  icon: string
  targetAmount: number
  createdAt: string
}

export interface GoalWithProgress extends SavingsGoal {
  /** Solde courant de l'enfant (peut dépasser la cible). */
  currentAmount: number
  /** Progression bornée à [0, 100]. */
  progress: number
  reached: boolean
}

export async function getGoals(): Promise<SavingsGoal[]> {
  const raw = await settingsRepository.get(GOALS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavingsGoal[]) : []
  } catch {
    return []
  }
}

export async function getGoalsForProfile(profileId: number): Promise<SavingsGoal[]> {
  const goals = await getGoals()
  return goals.filter((g) => g.profileId === profileId)
}

export async function addGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt'>
): Promise<SavingsGoal> {
  const goals = await getGoals()
  const newGoal: SavingsGoal = {
    ...goal,
    targetAmount: roundCents(goal.targetAmount),
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  }
  goals.push(newGoal)
  await settingsRepository.set(GOALS_KEY, JSON.stringify(goals))
  return newGoal
}

export async function removeGoal(id: string): Promise<void> {
  const goals = await getGoals()
  await settingsRepository.set(
    GOALS_KEY,
    JSON.stringify(goals.filter((g) => g.id !== id))
  )
}

/** Calcule la progression d'un objectif (fonction pure, testable). */
export function computeProgress(goal: SavingsGoal, currentBalance: number): GoalWithProgress {
  const target = goal.targetAmount
  const progress =
    target > 0 ? Math.min(100, Math.max(0, (currentBalance / target) * 100)) : 0
  return {
    ...goal,
    currentAmount: currentBalance,
    progress,
    reached: currentBalance >= target && target > 0,
  }
}
