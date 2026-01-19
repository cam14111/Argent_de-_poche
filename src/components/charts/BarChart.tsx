interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  height?: number
  showValues?: boolean
  formatValue?: (value: number) => string
}

const DEFAULT_COLOR = '#6366f1'

export function BarChart({
  data,
  height = 200,
  showValues = true,
  formatValue = (v) => v.toFixed(2),
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500">Aucune donnee</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.max(30, Math.min(60, 300 / data.length))
  const spacing = 10
  const chartWidth = data.length * (barWidth + spacing)
  const chartHeight = height - 40 // Espace pour les labels

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(chartWidth, 200)}
        height={height}
        className="mx-auto"
      >
        {/* Lignes de grille */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1="0"
            y1={chartHeight * (1 - ratio)}
            x2={chartWidth}
            y2={chartHeight * (1 - ratio)}
            stroke="#e5e7eb"
            strokeDasharray={ratio > 0 ? '4' : '0'}
          />
        ))}

        {/* Barres */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight
          const x = index * (barWidth + spacing) + spacing / 2
          const y = chartHeight - barHeight

          return (
            <g key={index}>
              {/* Barre */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color || DEFAULT_COLOR}
                rx="4"
                className="transition-opacity hover:opacity-80"
              />

              {/* Valeur au-dessus de la barre */}
              {showValues && item.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {formatValue(item.value)}
                </text>
              )}

              {/* Label en bas */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {item.label.length > 8
                  ? item.label.slice(0, 7) + '...'
                  : item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface HorizontalBarChartProps {
  data: BarChartData[]
  showValues?: boolean
  formatValue?: (value: number) => string
}

export function HorizontalBarChart({
  data,
  showValues = true,
  formatValue = (v) => v.toFixed(2) + ' EUR',
}: HorizontalBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-gray-500">Aucune donnee</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const widthPercent = (item.value / maxValue) * 100

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 truncate max-w-[200px]">
                {item.label}
              </span>
              {showValues && (
                <span className="text-gray-500 font-medium">
                  {formatValue(item.value)}
                </span>
              )}
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color || DEFAULT_COLOR,
                  minWidth: item.value > 0 ? '4px' : '0',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
