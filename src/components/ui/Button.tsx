import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };

  const variantStyles = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-[0.99]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 active:scale-[0.99]',
    outline:
      'border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-[0.99]',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs active:scale-[0.99]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
};
