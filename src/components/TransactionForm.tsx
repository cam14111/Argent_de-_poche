import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Input, Select, Textarea, Checkbox, Button, Dialog } from './ui'
import {
  profileRepository,
  motifRepository,
  transactionRepository,
  userRepository,
} from '@/db'

export interface TransactionFormDefaults {
  profileId?: number
  amount?: number
  type?: 'CREDIT' | 'DEBIT'
  motifId?: number
  description?: string
  hiddenForUsers?: boolean
}

interface TransactionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultProfileId?: number
  defaults?: TransactionFormDefaults
}

export function TransactionForm({
  onSuccess,
  onCancel,
  defaultProfileId,
  defaults,
}: TransactionFormProps) {
  // Sprint 6: Support des valeurs par defaut pour la duplication
  const initialAmount = defaults?.amount
    ? (defaults.type === 'DEBIT' ? -defaults.amount : defaults.amount).toString()
    : ''

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    defaults?.profileId?.toString() || defaultProfileId?.toString() || ''
  )
  const [amount, setAmount] = useState(initialAmount)
  const [selectedMotifId, setSelectedMotifId] = useState(defaults?.motifId?.toString() || '')
  const [description, setDescription] = useState(defaults?.description || '')
  const [hiddenForUsers, setHiddenForUsers] = useState(defaults?.hiddenForUsers || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [errors, setErrors] = useState({
    profileId: '',
    amount: '',
    motifId: '',
    description: '',
  })

  // Sprint 6: Exclure les profils et motifs archivés
  const profiles = useLiveQuery(() => profileRepository.getActive(), [])
  const allMotifs = useLiveQuery(() => motifRepository.getActive(), [])

  const amountValue = parseFloat(amount)
  const isCredit = !isNaN(amountValue) && amountValue > 0
  const isDebit = !isNaN(amountValue) && amountValue < 0

  const availableMotifs = allMotifs?.filter((motif) => {
    if (isCredit) {
      return motif.type === 'CREDIT' || motif.type === 'BOTH'
    } else if (isDebit) {
      return motif.type === 'DEBIT' || motif.type === 'BOTH'
    }
    return false
  })

  useEffect(() => {
    if (selectedMotifId && availableMotifs) {
      const motifStillAvailable = availableMotifs.some(
        (m) => m.id?.toString() === selectedMotifId
      )
      if (!motifStillAvailable) {
        setSelectedMotifId('')
      }
    }
  }, [availableMotifs, selectedMotifId])

  const validate = () => {
    const newErrors = {
      profileId: '',
      amount: '',
      motifId: '',
      description: '',
    }

    if (!selectedProfileId) {
      newErrors.profileId = 'Veuillez sélectionner un profil'
    }

    if (!amount || isNaN(amountValue) || amountValue === 0) {
      newErrors.amount = 'Veuillez entrer un montant valide (différent de 0)'
    }

    if (!selectedMotifId) {
      newErrors.motifId = 'Veuillez sélectionner un motif'
    }

    if (description.length > 500) {
      newErrors.description =
        'La description ne doit pas dépasser 500 caractères'
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setIsSubmitting(true)

      const parents = await userRepository.getParents()
      if (parents.length === 0) {
        throw new Error('Aucun parent trouvé')
      }
      const currentUserId = parents[0].id!

      const type = amountValue > 0 ? 'CREDIT' : 'DEBIT'

      await transactionRepository.create({
        profileId: parseInt(selectedProfileId),
        amount: Math.abs(amountValue),
        type,
        motifId: parseInt(selectedMotifId),
        description: description.trim() || undefined,
        createdBy: currentUserId,
        hiddenForUsers,
      })

      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
      setShowErrorDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    onSuccess?.()
  }

  const profileOptions = profiles
    ? [
        { value: '', label: 'Sélectionner un enfant' },
        ...profiles.map((p) => ({ value: p.id!.toString(), label: p.name })),
      ]
    : [{ value: '', label: 'Chargement...' }]

  const motifOptions = availableMotifs
    ? [
        { value: '', label: 'Sélectionner un motif' },
        ...availableMotifs.map((m) => ({
          value: m.id!.toString(),
          label: `${m.icon} ${m.label}`,
        })),
      ]
    : [{ value: '', label: 'Chargement...' }]

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Profil enfant"
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          options={profileOptions}
          error={errors.profileId}
          disabled={isSubmitting}
        />

        <Input
          label="Montant (€)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          helperText="Entrez un montant positif pour un crédit, négatif pour un débit"
          disabled={isSubmitting}
          placeholder="10.50 ou -5.00"
        />

        {(isCredit || isDebit) && (
          <Select
            label="Motif"
            value={selectedMotifId}
            onChange={(e) => setSelectedMotifId(e.target.value)}
            options={motifOptions}
            error={errors.motifId}
            disabled={isSubmitting}
          />
        )}

        <Textarea
          label="Description (optionnelle)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          helperText={`${description.length}/500 caractères`}
          disabled={isSubmitting}
          rows={3}
          placeholder="Ajouter des détails..."
        />

        <Checkbox
          label="Motif secret"
          helperText="Masquer le motif pour les enfants"
          checked={hiddenForUsers}
          onChange={(e) => setHiddenForUsers(e.target.checked)}
          disabled={isSubmitting}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            Créer la transaction
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          )}
        </div>
      </form>

      <Dialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        title="Transaction créée"
      >
        <p>La transaction a été créée avec succès.</p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={handleSuccessDialogClose}>
            OK
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Erreur"
      >
        <p>{errorMessage}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="danger" onClick={() => setShowErrorDialog(false)}>
            Fermer
          </Button>
        </div>
      </Dialog>
    </>
  )
}
