import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  header?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header }) => {
  return (
    <div className={`card-panel rounded-xl ${className}`}>
      {header && (
        <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50/50">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
