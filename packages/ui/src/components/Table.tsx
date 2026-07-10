import React from 'react';

export interface TableProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Table = ({ className = '', children }: TableProps) => {
  return (
    <div className={`w-full overflow-auto ${className}`.trim()}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
};

export const TableHeader = ({ className = '', children }: TableProps) => {
  return (
    <thead className={`border-b border-gray-200 ${className}`.trim()}>
      {children}
    </thead>
  );
};

export const TableBody = ({ className = '', children }: TableProps) => {
  return (
    <tbody className={`divide-y divide-gray-100 ${className}`.trim()}>
      {children}
    </tbody>
  );
};

export interface TableRowProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const TableRow = ({ className = '', children, onClick }: TableRowProps) => {
  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export interface TableHeadProps {
  className?: string;
  children?: React.ReactNode;
  scope?: string;
  onClick?: () => void;
}

export const TableHead = ({ className = '', children, scope = 'col', onClick }: TableHeadProps) => {
  return (
    <th
      scope={scope}
      className={`
        px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500
        ${onClick ? 'cursor-pointer hover:text-gray-900' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </th>
  );
};

export interface TableCellProps {
  className?: string;
  children?: React.ReactNode;
  colSpan?: number;
}

export const TableCell = ({ className = '', children, colSpan }: TableCellProps) => {
  return (
    <td className={`px-4 py-3 text-gray-700 ${className}`.trim()} colSpan={colSpan}>
      {children}
    </td>
  );
};
