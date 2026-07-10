import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
}: ToggleProps) => {
  const toggleId = React.useId();

  return (
    <div className={`flex items-start gap-3 ${className}`.trim()}>
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          ${
            checked
              ? 'bg-blue-600'
              : 'bg-gray-200'
          }
          ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : ''
          }
        `.trim()}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform ring-0 transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `.trim()}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
