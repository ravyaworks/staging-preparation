import React from 'react';

export type ProgressVariant = 'default' | 'success' | 'warning';
export type ProgressSize = 'sm' | 'md';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  size?: ProgressSize;
  className?: string;
}

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
};

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export const Progress = ({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  size = 'md',
  className = '',
}: ProgressProps) => {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;

  return (
    <div className={`w-full ${className}`.trim()}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full rounded-full bg-gray-200 ${sizeStyles[size]}`.trim()}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`
            rounded-full transition-all duration-300 ease-in-out
            ${variantStyles[variant]}
            ${sizeStyles[size]}
          `.trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
