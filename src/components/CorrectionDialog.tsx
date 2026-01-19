import { useState } from 'react'
import { Dialog, Button, Input } from './ui'
import { type Transaction } from '@/db/database'
import { transactionRepository, userRepository } from '@/db'

interface CorrectionDialogProps {
  open: boolean
  onClose: () => void
  transaction: Transaction
  onSuccess: () => void
}

export function CorrectionDialog({
  open,
  onClose,
  transaction,
  onSuccess,
}: CorrectionDialogProps) {
  const [correctionType, setCorrectionType] = useState<'CANCEL' | 'ADJUST'>(
    'CANCEL'
  )
  const [newAmount, setNewAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    try {
      setError('')
      setIsSubmitting(true)

      if (correctionType === 'ADJUST') {
        const parsedAmount = parseFloat(newAmount)
        if (isNaN(parsedAmount) || parsedAmount === transaction.amount) {
          setError('Le nouveau montant doit être différent du montant actuel')
          return
        }
      }

      const parents = await userRepository.getParents()
      if (parents.length === 0) {
        throw new Error('Aucun parent trouvé')
      }
      const userId = parents[0].id!

      await transactionRepository.createCorrection(
        transaction.id!,
        correctionType,
        userId,
        correctionType === 'ADJUST' ? parseFloat(newAmount) : undefined
      )

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erreur lors de la correction:', err)
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Corriger la transaction">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Montant actuel</p>
          <p className="text-lg font-bold">
            {transaction.type === 'CREDIT' ? '+' : '-'}
            {transaction.amount.toFixed(2)} €
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="correctionType"
              value="CANCEL"
              checked={correctionType === 'CANCEL'}
              onChange={() => setCorrectionType('CANCEL')}
              disabled={isSubmitting}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Annuler complètement</p>
              <p className="text-sm text-gray-600">
                Crée une contre-écriture pour annuler cette transaction
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="correctionType"
              value="ADJUST"
              checked={correctionType === 'ADJUST'}
              onChange={() => setCorrectionType('ADJUST')}
              disabled={isSubmitting}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium">Ajuster le montant</p>
              <p className="text-sm text-gray-600 mb-2">
                Corrige le montant en créant une transaction d'ajustement
              </p>
              {correctionType === 'ADJUST' && (
                <Input
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder={transaction.amount.toFixed(2)}
                  disabled={isSubmitting}
                  error={error}
                />
              )}
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            Confirmer
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
