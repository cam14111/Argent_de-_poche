import { useEffect, useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { profileRepository } from '@/db'
import {
  addGoal,
  removeGoal,
  getGoals,
  computeProgress,
  type SavingsGoal,
} from '@/lib/goals'
import { parseAmount, MAX_AMOUNT, formatEuros } from '@/lib/money'
import { GoalProgress } from '@/components/GoalProgress'

type StatusMessage = { type: 'success' | 'error'; message: string }

const GOAL_ICONS = ['🎯', '🚲', '🎮', '📱', '🧸', '👟', '📚', '🎸', '⚽', '🎁']

export function GoalsManagement() {
  const { isParentMode } = useAuth()
  const profiles = useLiveQuery(() => profileRepository.getActive(), [])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [balances, setBalances] = useState<Record<number, number>>({})
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const [profileId, setProfileId] = useState('')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(GOAL_ICONS[0])
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    const [allGoals, activeProfiles] = await Promise.all([
      getGoals(),
      profileRepository.getActive(),
    ])
    setGoals(allGoals)
    const balanceEntries = await Promise.all(
      activeProfiles.map(async (p) => [p.id!, await profileRepository.getBalance(p.id!)] as const)
    )
    setBalances(Object.fromEntries(balanceEntries))
  }

  useEffect(() => {
    void reload()
  }, [])

  if (!isParentMode) {
    return <Navigate to="/" />
  }

  const handleAdd = async () => {
    setError('')
    if (!profileId) {
      setError('Choisissez un enfant.')
      return
    }
    if (!name.trim()) {
      setError('Donnez un nom à l’objectif.')
      return
    }
    const parsed = parseAmount(target)
    if (parsed === null || parsed <= 0) {
      setError('Montant cible invalide.')
      return
    }
    if (parsed > MAX_AMOUNT) {
      setError(`La cible ne peut pas dépasser ${MAX_AMOUNT} €.`)
      return
    }

    setSaving(true)
    try {
      await addGoal({
        profileId: Number.parseInt(profileId, 10),
        name: name.trim(),
        icon,
        targetAmount: parsed,
      })
      setName('')
      setTarget('')
      setStatus({ type: 'success', message: 'Objectif ajouté.' })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’ajout.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (goal: SavingsGoal) => {
    if (!window.confirm(`Supprimer l’objectif « ${goal.name} » ?`)) return
    await removeGoal(goal.id)
    setStatus({ type: 'success', message: 'Objectif supprimé.' })
    await reload()
  }

  const profileName = (id: number) => profiles?.find((p) => p.id === id)?.name ?? 'Inconnu'

  return (
    <AppShell title="Objectifs d'épargne" backTo="/settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {status && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nouvel objectif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              label="Enfant"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              options={[
                { value: '', label: 'Choisir un enfant' },
                ...(profiles?.map((p) => ({ value: String(p.id), label: p.name })) ?? []),
              ]}
            />
            <Input
              label="Nom de l'objectif"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nouveau vélo"
              maxLength={40}
            />
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Icône</span>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    aria-pressed={icon === emoji}
                    aria-label={`Icône ${emoji}`}
                    className={`w-10 h-10 rounded-lg text-xl transition-colors ${
                      icon === emoji
                        ? 'bg-indigo-100 ring-2 ring-indigo-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Montant cible (€)"
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="100"
              error={error}
            />
            <Button variant="primary" onClick={handleAdd} loading={saving}>
              Ajouter l'objectif
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectifs en cours</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun objectif pour le moment.</p>
            ) : (
              <ul className="space-y-4">
                {goals.map((goal) => {
                  const progress = computeProgress(goal, balances[goal.profileId] ?? 0)
                  return (
                    <li key={goal.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {profileName(goal.profileId)} · cible {formatEuros(goal.targetAmount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(goal)}
                        >
                          Supprimer
                        </Button>
                      </div>
                      <GoalProgress goal={progress} />
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
