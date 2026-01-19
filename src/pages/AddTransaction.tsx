import { Navigate, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { TransactionForm, type TransactionFormDefaults } from '@/components/TransactionForm'

export function AddTransaction() {
  const { isParentMode } = useAuth()
  const navigate = useNavigate()

  // Sprint 6: Recuperer les parametres de duplication depuis l'URL
  const search = useSearch({ strict: false }) as {
    duplicate?: string
    profileId?: string
    amount?: string
    type?: string
    motifId?: string
    description?: string
    hidden?: string
  }
  const defaultProfileId = search.profileId ? parseInt(search.profileId) : undefined

  if (!isParentMode) {
    return <Navigate to="/" />
  }

  // Construire les valeurs par defaut si on est en mode duplication
  const defaults: TransactionFormDefaults | undefined = search.duplicate
    ? {
        profileId: search.profileId ? parseInt(search.profileId) : undefined,
        amount: search.amount ? parseFloat(search.amount) : undefined,
        type: search.type as 'CREDIT' | 'DEBIT' | undefined,
        motifId: search.motifId ? parseInt(search.motifId) : undefined,
        description: search.description,
        hiddenForUsers: search.hidden === 'true',
      }
    : undefined

  const title = search.duplicate ? 'Dupliquer la transaction' : 'Ajouter une transaction'

  return (
    <AppShell title={title}>
      <div className="max-w-2xl mx-auto p-4">
        <TransactionForm
          onSuccess={() => navigate({ to: '/' })}
          onCancel={() => navigate({ to: '/' })}
          defaultProfileId={defaultProfileId}
          defaults={defaults}
        />
      </div>
    </AppShell>
  )
}
