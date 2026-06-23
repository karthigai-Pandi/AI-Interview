import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  status?: string;
  className?: string;
}

export function Badge({ children, status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        status ? getStatusColor(status) : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        className
      )}
    >
      {children}
    </span>
  );
}
