import React from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900',
};

export const Tooltip = ({ content, children, position = 'top', className = '' }: TooltipProps) => {
  const [visible, setVisible] = React.useState(false);
  const showDelay = React.useRef<ReturnType<typeof setTimeout>>();
  const hideDelay = React.useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(hideDelay.current);
    showDelay.current = setTimeout(() => setVisible(true), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(showDelay.current);
    hideDelay.current = setTimeout(() => setVisible(false), 100);
  };

  const handleFocus = () => setVisible(true);
  const handleBlur = () => setVisible(false);

  React.useEffect(() => {
    return () => {
      clearTimeout(showDelay.current);
      clearTimeout(hideDelay.current);
    };
  }, []);

  return (
    <div
      className={`relative inline-flex ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded
            whitespace-nowrap pointer-events-none
            transition-opacity duration-150
            ${positionStyles[position]}
          `.trim()}
          role="tooltip"
        >
          {content}
          <div className={`absolute ${arrowStyles[position]}`} />
        </div>
      )}
    </div>
  );
};
