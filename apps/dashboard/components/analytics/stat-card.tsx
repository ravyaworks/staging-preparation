'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@conversation-platform/ui'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  description?: string
  className?: string
}

export function StatCard({ title, value, change, trend, icon, description, className }: StatCardProps) {
  const trendIcon = trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : trend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />
  const trendColor = trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'

  return (
    <Card className={cn('p-0', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {change !== undefined && (
            <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium', trendColor)}>
              {trendIcon}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 text-xs text-gray-400">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
