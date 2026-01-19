interface PieChartData {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  showLegend?: boolean
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ef4444', // red
]

export function PieChart({ data, size = 200, showLegend = true }: PieChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0)

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
        </svg>
        <p className="text-sm text-gray-500">Aucune donnee</p>
      </div>
    )
  }

  // Calculer les segments
  let cumulativePercentage = 0
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const startAngle = (cumulativePercentage / 100) * 360
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360
    cumulativePercentage += percentage

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: item.color || COLORS[index % COLORS.length],
    }
  })

  // Convertir angle en coordonnees
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  // Generer le path d'un arc
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z',
    ].join(' ')
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((segment, index) => {
          // Cas special: un seul segment = cercle complet
          if (segments.length === 1) {
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill={segment.color}
              />
            )
          }

          return (
            <path
              key={index}
              d={describeArc(50, 50, 40, segment.startAngle, segment.endAngle)}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          )
        })}
        {/* Cercle central pour effet donut */}
        <circle cx="50" cy="50" r="20" fill="white" />
      </svg>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-gray-600 truncate max-w-[80px]">
                {segment.label}
              </span>
              <span className="text-gray-400">
                {segment.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function getChartColor(index: number): string {
  return COLORS[index % COLORS.length]
}
