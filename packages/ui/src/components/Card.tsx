import React from 'react';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = ({ className = '', children }: CardProps) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`.trim()}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children }: CardProps) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`.trim()}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className = '', children }: CardProps) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`.trim()}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className = '', children }: CardProps) => {
  return (
    <p className={`mt-1 text-sm text-gray-500 ${className}`.trim()}>
      {children}
    </p>
  );
};

export const CardContent = ({ className = '', children }: CardProps) => {
  return (
    <div className={`px-6 py-4 ${className}`.trim()}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className = '', children }: CardProps) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`.trim()}>
      {children}
    </div>
  );
};
