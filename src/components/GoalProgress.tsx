import type { GoalWithProgress } from '@/lib/goals'
import { formatEuros } from '@/lib/money'

interface GoalProgressProps {
  goal: GoalWithProgress
  /** Version compacte pour l'affichage sous une carte enfant. */
  compact?: boolean
}

export function GoalProgress({ goal, compact = false }: GoalProgressProps) {
  const pct = Math.round(goal.progress)
  const barColor = goal.reached ? 'bg-green-500' : 'bg-indigo-500'

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-800 flex items-center gap-1.5">
          <span aria-hidden="true">{goal.icon}</span>
          {goal.name}
          {goal.reached && (
            <span className="text-green-600 text-xs font-semibold">Atteint 🎉</span>
          )}
        </span>
        <span className="text-gray-500 tabular-nums">
          {formatEuros(Math.min(goal.currentAmount, goal.targetAmount))} /{' '}
          {formatEuros(goal.targetAmount)}
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression de l'objectif ${goal.name}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
