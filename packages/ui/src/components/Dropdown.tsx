import React from 'react';

export type DropdownAlign = 'start' | 'end';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: DropdownAlign;
  className?: string;
}

export const Dropdown = ({ trigger, items, align = 'start', className = '' }: DropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`
            absolute z-40 mt-1 min-w-[12rem] rounded-lg bg-white border border-gray-200 shadow-lg
            py-1 transition-opacity duration-100
            ${align === 'end' ? 'right-0' : 'left-0'}
          `.trim()}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setOpen(false);
                }
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                transition-colors duration-100
                focus:outline-none focus-visible:bg-gray-100
                ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }
                ${
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `.trim()}
            >
              {item.icon && (
                <span className="flex-shrink-0 h-4 w-4" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
