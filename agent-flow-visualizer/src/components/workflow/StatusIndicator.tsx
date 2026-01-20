import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'idle' | 'running' | 'complete';
  size?: 'sm' | 'md';
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  
  return (
    <div
      className={cn(
        'rounded-full',
        sizeClasses,
        status === 'idle' && 'bg-muted-foreground',
        status === 'running' && 'bg-primary animate-pulse',
        status === 'complete' && 'bg-primary'
      )}
    />
  );
}
