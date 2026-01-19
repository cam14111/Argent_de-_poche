import { Card } from './ui/Card'
import type { Profile } from '@/db'

interface BalanceCardProps {
  profile: Profile
  balance: number
  onClick?: () => void
}

export function BalanceCard({ profile, balance, onClick }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(balance)

  const isPositive = balance >= 0

  return (
    <Card
      className={`cursor-pointer transition-transform hover:scale-[1.02] ${onClick ? 'active:scale-[0.98]' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: profile.color + '20' }}
        >
          {profile.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{profile.name}</h3>
          <p
            className={`text-lg sm:text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          >
            {formattedBalance}
          </p>
        </div>
      </div>
    </Card>
  )
}

interface BalanceCardSkeletonProps {
  name?: string
}

export function BalanceCardSkeleton({ name }: BalanceCardSkeletonProps) {
  return (
    <Card>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2">
            {name && <span className="sr-only">{name}</span>}
          </div>
          <div className="h-6 sm:h-7 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  )
}
