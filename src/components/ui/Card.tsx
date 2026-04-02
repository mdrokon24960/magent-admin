import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card = ({ children, className, glass = true }: CardProps) => {
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden',
      glass ? 'glass' : 'bg-bg-card border border-bg-border',
      className
    )}>
      {children}
    </div>
  );
};
