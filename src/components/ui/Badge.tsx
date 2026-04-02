import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'info', className }: BadgeProps) => {
  const variants = {
    success: 'bg-success/10 text-success border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    danger:  'bg-danger/10 text-danger border-danger/30',
    info:    'bg-accent/10 text-accent border-accent/30',
  };

  return (
    <span className={cn(
      'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
