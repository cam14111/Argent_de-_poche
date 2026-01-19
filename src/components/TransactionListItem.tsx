import { type Transaction, type Motif } from '@/db/database'
import { Card } from './ui'

interface TransactionListItemProps {
  transaction: Transaction
  motif: Motif
  isChildMode: boolean
  onClick?: () => void
}

export function TransactionListItem({
  transaction,
  motif,
  isChildMode,
  onClick,
}: TransactionListItemProps) {
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const amountColor =
    transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
  const amountSign = transaction.type === 'CREDIT' ? '+' : '-'

  const displayMotif =
    transaction.hiddenForUsers && isChildMode
      ? '🔒 Secret'
      : `${motif.icon} ${motif.label}`

  const truncatedDescription = transaction.description
    ? transaction.description.length > 30
      ? transaction.description.slice(0, 30) + '...'
      : transaction.description
    : ''

  const hasLinkedTransaction = !!transaction.linkedTransactionId

  return (
    <Card
      padding="md"
      className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-500">
              {dateFormatter.format(transaction.createdAt)}
            </p>
            {hasLinkedTransaction && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Corrigée
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900 mb-1">{displayMotif}</p>
          {truncatedDescription && (
            <p className="text-sm text-gray-600">{truncatedDescription}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <p className={`text-lg font-bold ${amountColor}`}>
            {amountSign}
            {transaction.amount.toFixed(2)} €
          </p>
        </div>
      </div>
    </Card>
  )
}
