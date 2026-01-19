import { useState } from 'react'
import { Card } from './ui'

export interface FilterState {
  period: 'current-month' | 'all'
  type: 'all' | 'CREDIT' | 'DEBIT'
}

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export function TransactionFilters({ onFilterChange }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    period: 'all',
    type: 'all',
  })

  const handlePeriodChange = (period: FilterState['period']) => {
    const newFilters = { ...filters, period }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTypeChange = (type: FilterState['type']) => {
    const newFilters = { ...filters, type }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const radioButtonClass = (isSelected: boolean) => `
    px-4 py-2 text-sm font-medium rounded-lg
    transition-colors duration-200
    ${
      isSelected
        ? 'bg-indigo-500 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  `

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Période
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePeriodChange('current-month')}
              className={radioButtonClass(filters.period === 'current-month')}
            >
              Mois en cours
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('all')}
              className={radioButtonClass(filters.period === 'all')}
            >
              Tout
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleTypeChange('all')}
              className={radioButtonClass(filters.type === 'all')}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('CREDIT')}
              className={radioButtonClass(filters.type === 'CREDIT')}
            >
              Crédits
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('DEBIT')}
              className={radioButtonClass(filters.type === 'DEBIT')}
            >
              Débits
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
