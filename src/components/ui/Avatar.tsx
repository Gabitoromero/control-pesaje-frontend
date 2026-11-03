import { getAvatarInitials } from '../../features/tablet/utils/avatarInitials';

export interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
} as const;

/**
 * Decorative user avatar: brand gradient with the user's initials. The name
 * is always rendered next to it, so it is hidden from assistive tech.
 */
export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={`${SIZES[size]} shrink-0 select-none rounded-full bg-gradient-to-br from-brand to-brand-hover text-white font-semibold tracking-wide flex items-center justify-center shadow-sm ring-2 ring-brand/25 ring-offset-2 ring-offset-card ${className}`}
    >
      {getAvatarInitials(name)}
    </div>
  );
}
