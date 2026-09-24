import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, variant = 'info' }: { children: React.ReactNode, variant?: 'info' | 'critical' | 'warning' | 'success' }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
};
