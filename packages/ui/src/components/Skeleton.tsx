import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) => {
  const baseStyles = 'animate-pulse bg-gray-200';

  const defaultDimensions =
    variant === 'circular'
      ? { width: 40, height: 40 }
      : {};

  const style: React.CSSProperties = {
    width: width ?? defaultDimensions.width,
    height: height ?? defaultDimensions.height,
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  ));

  return <>{items}</>;
};
