import { useState } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { CorrectionDialog } from '@/components/CorrectionDialog'
import {
  transactionRepository,
  motifRepository,
  userRepository,
  profileRepository,
} from '@/db'
import { useAuth } from '@/contexts/AuthContext'

export function TransactionDetail() {
  const { id } = useParams({ strict: false })
  const { isParentMode } = useAuth()
  const navigate = useNavigate()
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)

  const transaction = useLiveQuery(
    () => (id ? transactionRepository.getById(parseInt(id)) : undefined),
    [id]
  )

  const motif = useLiveQuery(
    () =>
      transaction?.motifId
        ? motifRepository.getById(transaction.motifId)
        : undefined,
    [transaction?.motifId]
  )

  const creator = useLiveQuery(
    () =>
      transaction?.createdBy
        ? userRepository.getById(transaction.createdBy)
        : undefined,
    [transaction?.createdBy]
  )

  const profile = useLiveQuery(
    () =>
      transaction?.profileId
        ? profileRepository.getById(transaction.profileId)
        : undefined,
    [transaction?.profileId]
  )

  const linkedTransaction = useLiveQuery(
    () =>
      transaction?.linkedTransactionId
        ? transactionRepository.getById(transaction.linkedTransactionId)
        : undefined,
    [transaction?.linkedTransactionId]
  )

  if (!transaction || !motif) {
    return (
      <AppShell title="Détail de la transaction">
        <div className="p-4">
          <p className="text-gray-500">Transaction introuvable</p>
        </div>
      </AppShell>
    )
  }

  const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const amountColor =
    transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
  const amountSign = transaction.type === 'CREDIT' ? '+' : '-'

  const canCorrect = isParentMode && !transaction.linkedTransactionId

  const handleCorrect = () => {
    setShowCorrectionDialog(true)
  }

  const handleCorrectionSuccess = () => {
    setShowCorrectionDialog(false)
    // Les données seront automatiquement rafraîchies grâce à useLiveQuery
  }

  // Sprint 6: Fonction de duplication
  const handleDuplicate = () => {
    if (!transaction) return

    const params = new URLSearchParams({
      duplicate: '1',
      profileId: transaction.profileId.toString(),
      amount: transaction.amount.toString(),
      type: transaction.type,
      motifId: transaction.motifId.toString(),
    })

    if (transaction.description) {
      params.set('description', transaction.description)
    }
    if (transaction.hiddenForUsers) {
      params.set('hidden', 'true')
    }

    navigate({ to: `/transactions/add?${params.toString()}` })
  }

  return (
    <AppShell title="Détail de la transaction">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Profil</p>
              <p className="font-medium">{profile?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Date et heure</p>
              <p className="font-medium">
                {dateTimeFormatter.format(transaction.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Montant</p>
              <p className={`text-3xl font-bold ${amountColor}`}>
                {amountSign}
                {transaction.amount.toFixed(2)} €
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Motif</p>
              <p className="font-medium text-lg">
                {motif.icon} {motif.label}
              </p>
            </div>

            {transaction.description && (
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{transaction.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Créée par</p>
              <p className="font-medium">{creator?.name || 'Inconnu'}</p>
            </div>

            {transaction.linkedTransactionId && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Statut</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Transaction corrigée
                  </span>
                  {linkedTransaction && linkedTransaction.id && (
                    <Link
                      to={`/transactions/$id`}
                      params={{ id: linkedTransaction.id.toString() }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Voir la correction →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {isParentMode && (
              <div className="pt-4 border-t space-y-2">
                <Button variant="primary" onClick={handleDuplicate} className="w-full">
                  Dupliquer cette transaction
                </Button>
                {canCorrect && (
                  <Button variant="secondary" onClick={handleCorrect} className="w-full">
                    Corriger cette transaction
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => window.history.back()}>
            ← Retour
          </Button>
        </div>
      </div>

      {transaction && (
        <CorrectionDialog
          open={showCorrectionDialog}
          onClose={() => setShowCorrectionDialog(false)}
          transaction={transaction}
          onSuccess={handleCorrectionSuccess}
        />
      )}
    </AppShell>
  )
}
