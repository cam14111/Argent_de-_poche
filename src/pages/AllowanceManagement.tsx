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
  getAllowanceConfigs,
  setAllowanceConfig,
  type AllowanceConfig,
} from '@/lib/allowance'
import { parseAmount, MAX_AMOUNT, formatEuros } from '@/lib/money'

type StatusMessage = { type: 'success' | 'error'; message: string }

const WEEKDAYS = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '0', label: 'Dimanche' },
]

interface ProfileRowProps {
  profileId: number
  name: string
  icon: string
  config: AllowanceConfig | undefined
  onSaved: (message: StatusMessage) => void
}

function AllowanceRow({ profileId, name, icon, config, onSaved }: ProfileRowProps) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false)
  const [amount, setAmount] = useState(config ? String(config.amount) : '')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>(
    config?.frequency ?? 'weekly'
  )
  const [dayOfWeek, setDayOfWeek] = useState(String(config?.dayOfWeek ?? 6))
  const [dayOfMonth, setDayOfMonth] = useState(String(config?.dayOfMonth ?? 1))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEnabled(config?.enabled ?? false)
    setAmount(config ? String(config.amount) : '')
    setFrequency(config?.frequency ?? 'weekly')
    setDayOfWeek(String(config?.dayOfWeek ?? 6))
    setDayOfMonth(String(config?.dayOfMonth ?? 1))
  }, [config])

  const handleSave = async () => {
    setError('')
    if (!enabled) {
      setSaving(true)
      try {
        await setAllowanceConfig(profileId, null)
        onSaved({ type: 'success', message: `Argent de poche désactivé pour ${name}.` })
      } finally {
        setSaving(false)
      }
      return
    }

    const parsed = parseAmount(amount)
    if (parsed === null || parsed <= 0) {
      setError('Montant invalide.')
      return
    }
    if (parsed > MAX_AMOUNT) {
      setError(`Le montant ne peut pas dépasser ${MAX_AMOUNT} €.`)
      return
    }

    setSaving(true)
    try {
      const next: AllowanceConfig = {
        amount: parsed,
        frequency,
        enabled: true,
        // Le calcul des versements dus démarre à partir de maintenant :
        // on ne crée pas de rattrapage rétroactif lors de la 1re config.
        lastAppliedAt: config?.lastAppliedAt ?? new Date().toISOString(),
        ...(frequency === 'weekly'
          ? { dayOfWeek: Number.parseInt(dayOfWeek, 10) }
          : { dayOfMonth: Number.parseInt(dayOfMonth, 10) }),
      }
      await setAllowanceConfig(profileId, next)
      onSaved({
        type: 'success',
        message: `Argent de poche de ${formatEuros(parsed)} enregistré pour ${name}.`,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <span className="font-medium text-gray-900">{name}</span>
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Activé
        </label>
      </div>

      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
          <Input
            label="Montant (€)"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5"
            error={error}
          />
          <Select
            label="Fréquence"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly')}
            options={[
              { value: 'weekly', label: 'Chaque semaine' },
              { value: 'monthly', label: 'Chaque mois' },
            ]}
          />
          {frequency === 'weekly' ? (
            <Select
              label="Jour de versement"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              options={WEEKDAYS}
            />
          ) : (
            <Select
              label="Jour du mois"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              options={Array.from({ length: 28 }, (_, i) => ({
                value: String(i + 1),
                label: `Le ${i + 1}`,
              }))}
            />
          )}
        </div>
      )}

      <div className="pl-9">
        <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}

export function AllowanceManagement() {
  const { isParentMode } = useAuth()
  const profiles = useLiveQuery(() => profileRepository.getActive(), [])
  const [configs, setConfigs] = useState<Record<string, AllowanceConfig>>({})
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const reloadConfigs = async () => {
    setConfigs(await getAllowanceConfigs())
  }

  useEffect(() => {
    void reloadConfigs()
  }, [])

  if (!isParentMode) {
    return <Navigate to="/" />
  }

  const handleSaved = (message: StatusMessage) => {
    setStatus(message)
    void reloadConfigs()
  }

  return (
    <AppShell title="Argent de poche automatique" backTo="/settings">
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
            <CardTitle>Versements récurrents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              Configurez un versement automatique par enfant. Les versements dus
              vous sont proposés sur l’accueil : ils ne sont ajoutés qu’après
              votre validation, pour éviter les doublons entre parents.
            </p>
            {!profiles || profiles.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun profil actif.</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {profiles.map((p) => (
                  <AllowanceRow
                    key={p.id}
                    profileId={p.id!}
                    name={p.name}
                    icon={p.icon}
                    config={configs[String(p.id)]}
                    onSaved={handleSaved}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
