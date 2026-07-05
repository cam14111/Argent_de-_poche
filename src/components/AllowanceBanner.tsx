import { useEffect, useState, useCallback } from 'react'
import { Button } from './ui'
import {
  getPendingPayments,
  applyPendingPayments,
  type PendingPayment,
} from '@/lib/allowance'
import { formatEuros, sumAmounts } from '@/lib/money'

interface AllowanceBannerProps {
  /** Appelé après application pour rafraîchir les soldes de l'accueil. */
  onApplied?: () => void
}

/**
 * Bannière proposant au parent d'appliquer les versements d'argent de poche
 * arrivés à échéance. Rien n'est versé sans action explicite.
 */
export function AllowanceBanner({ onApplied }: AllowanceBannerProps) {
  const [pending, setPending] = useState<PendingPayment[]>([])
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setPending(await getPendingPayments())
    } catch {
      setPending([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleApply = async () => {
    setApplying(true)
    setMessage(null)
    try {
      const count = await applyPendingPayments()
      setMessage(
        count > 0
          ? `${count} versement${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''}.`
          : 'Aucun versement à ajouter.'
      )
      await load()
      onApplied?.()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur lors du versement.')
    } finally {
      setApplying(false)
    }
  }

  if (pending.length === 0) {
    return message ? (
      <div className="rounded-xl bg-green-50 text-green-800 px-4 py-3 text-sm">
        {message}
      </div>
    ) : null
  }

  const total = sumAmounts(pending.map((p) => p.amount))

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-indigo-900">
        <p className="font-semibold">Argent de poche à verser</p>
        <p>
          {pending.length} versement{pending.length > 1 ? 's' : ''} en attente ·{' '}
          {formatEuros(total)}
        </p>
      </div>
      <Button variant="primary" size="sm" onClick={handleApply} loading={applying}>
        Verser maintenant
      </Button>
    </div>
  )
}
