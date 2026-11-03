import { getAvatarInitials } from '../../features/tablet/utils/avatarInitials';
import { getSectorColor, getSectorLabel } from '../../lib/sectores';

export interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
  /** Sector code of the user: when present the avatar is filled with the sector color instead of the brand gradient. */
  sector?: string | null;
  'data-testid'?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
} as const;

/**
 * Decorative user avatar: the user's initials on the sector color (or the brand gradient when the
 * user has no sector). The name is always rendered next to it, so it is hidden from assistive tech.
 */
export function Avatar({ name, size = 'md', className = '', sector, 'data-testid': testId }: AvatarProps) {
  const fill = sector ? undefined : 'bg-gradient-to-br from-brand to-brand-hover';
  return (
    <div
      aria-hidden="true"
      data-testid={testId}
      title={sector ? getSectorLabel(sector) ?? undefined : undefined}
      style={sector ? { backgroundColor: getSectorColor(sector) } : undefined}
      className={`${SIZES[size]} shrink-0 select-none rounded-full ${fill ?? ''} text-white font-semibold tracking-wide flex items-center justify-center shadow-sm ring-2 ring-brand/25 ring-offset-2 ring-offset-card ${className}`}
    >
      {getAvatarInitials(name)}
    </div>
  );
}
