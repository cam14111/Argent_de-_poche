import { useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from '@/components/layout/AppShell'
import {
  TransactionFilters,
  type FilterState,
} from '@/components/TransactionFilters'
import { TransactionListItem } from '@/components/TransactionListItem'
import { Button, Card, CardContent } from '@/components/ui'
import { profileRepository, transactionRepository, motifRepository } from '@/db'
import { useAuth } from '@/contexts/AuthContext'
import { useMemberDataLoader } from '@/hooks/useMemberDataLoader'

export function TransactionList() {
  const { profileId } = useParams({ strict: false })
  const navigate = useNavigate()
  const { isChildMode, isParentMode } = useAuth()

  // Charger les données depuis Drive pour les membres (enfants)
  useMemberDataLoader()

  const [filters, setFilters] = useState<FilterState>({
    period: 'all',
    type: 'all',
  })
  const [displayCount, setDisplayCount] = useState(20)

  const profile = useLiveQuery(
    () => (profileId ? profileRepository.getById(parseInt(profileId)) : undefined),
    [profileId]
  )

  const balance = useLiveQuery(
    () =>
      profileId ? profileRepository.getBalance(parseInt(profileId)) : undefined,
    [profileId]
  )

  const transactions = useLiveQuery(
    () =>
      profileId
        ? transactionRepository.getByProfileId(parseInt(profileId), false)
        : [],
    [profileId]
  )

  const motifs = useLiveQuery(() => motifRepository.getAll(), [])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    let filtered = [...transactions]

    if (filters.period === 'current-month') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter((tx) => tx.createdAt >= startOfMonth)
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((tx) => tx.type === filters.type)
    }

    return filtered
  }, [transactions, filters])

  const displayedTransactions = filteredTransactions.slice(0, displayCount)
  const hasMore = displayedTransactions.length < filteredTransactions.length

  const handleTransactionClick = (transactionId: number) => {
    navigate({ to: `/transactions/${transactionId}` })
  }

  const handleAddTransaction = () => {
    if (profileId) {
      navigate({ to: `/transactions/add?profileId=${profileId}` })
      return
    }

    navigate({ to: '/transactions/add' })
  }

  if (!profile) {
    return (
      <AppShell title="Transactions">
        <div className="p-4">
          <p className="text-gray-500">Profil introuvable</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={`Transactions - ${profile.name}`}>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde actuel</p>
              <p
                className={`text-3xl font-bold ${
                  (balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {(balance ?? 0).toFixed(2)} €
              </p>
            </div>
            {isParentMode && (
              <Button variant="primary" onClick={handleAddTransaction}>
                + Ajouter
              </Button>
            )}
          </div>
        </Card>

        <TransactionFilters onFilterChange={setFilters} />

        {displayedTransactions.length === 0 ? (
          <Card padding="lg">
            <CardContent>
              <p className="text-center text-gray-500">
                Aucune transaction trouvée
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {displayedTransactions.map((tx) => {
                const motif = motifs?.find((m) => m.id === tx.motifId)
                if (!motif) return null

                return (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    motif={motif}
                    isChildMode={isChildMode}
                    onClick={() => handleTransactionClick(tx.id!)}
                  />
                )
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                >
                  Charger plus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
