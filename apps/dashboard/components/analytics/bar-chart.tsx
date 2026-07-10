'use client'

import { cn } from '@/lib/utils'

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  height?: number
  showValues?: boolean
  className?: string
  horizontal?: boolean
  maxValue?: number
}

export function BarChart({ data, height = 200, showValues = false, className, horizontal = false, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  if (horizontal) {
    return (
      <div className={cn('space-y-2', className)}>
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 text-right text-xs text-gray-500 truncate">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color ?? '#3b82f6',
                }}
              />
            </div>
            {showValues && (
              <span className="w-12 text-xs font-medium text-gray-700">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-1', className)} style={{ height }}>
      {data.map((item) => {
        const pct = (item.value / max) * 100
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center justify-end h-full">
            {showValues && (
              <span className="text-[10px] font-medium text-gray-500 mb-1">{item.value}</span>
            )}
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${pct}%`,
                backgroundColor: item.color ?? '#3b82f6',
                minHeight: pct > 0 ? '4px' : '0px',
              }}
            />
            <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
