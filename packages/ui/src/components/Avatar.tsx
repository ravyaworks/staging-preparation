import React from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-12 w-12', text: 'text-base' },
  xl: { container: 'h-16 w-16', text: 'text-lg' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const Avatar = ({ src, alt = '', name, size = 'md', className = '' }: AvatarProps) => {
  const [imageError, setImageError] = React.useState(false);
  const { container, text } = sizeStyles[size];
  const initials = name ? getInitials(name) : null;

  const showFallback = !src || imageError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full
        bg-gray-200 text-gray-600 font-medium
        overflow-hidden flex-shrink-0
        ${container}
        ${text}
        ${className}
      `.trim()}
      aria-label={alt || name || 'Avatar'}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <svg
          className="h-2/3 w-2/3 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 20.993V24H0v-2.46A10.996 10.996 0 0112 14c3.475 0 6.594 1.614 8.6 4.12l.4.52zM12 12a6 6 0 100-12 6 6 0 000 12z" />
        </svg>
      )}
    </div>
  );
};
