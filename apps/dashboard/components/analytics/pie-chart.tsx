'use client'

import { cn } from '@/lib/utils'

interface PieChartData {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  showLegend?: boolean
  className?: string
}

export function PieChart({ data, size = 160, showLegend = true, className }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let cumulative = 0
  const gradientParts = data.map((d) => {
    const start = cumulative
    cumulative += d.value
    const pctStart = total > 0 ? (start / total) * 100 : 0
    const pctEnd = total > 0 ? (cumulative / total) * 100 : 0
    return `${d.color} ${pctStart}% ${pctEnd}%`
  })
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: conicGradient,
        }}
      />
      {showLegend && (
        <div className="flex flex-wrap gap-3 justify-center">
          {data.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={d.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-gray-600">{d.label}</span>
                <span className="text-gray-400">{pct}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
