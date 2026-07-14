import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, subtitle, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center p-8 ${className ?? ''}`}>
      <Icon className="text-muted-foreground" size={40} />
      <p className="text-base font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
