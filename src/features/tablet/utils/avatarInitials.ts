/**
 * Derives display initials for an avatar from a user's `nombreUsuario`.
 * - 2+ words: first character of the first two words.
 * - 1 word: first two characters of that word.
 * - empty/undefined: falls back to '?'.
 */
export const getAvatarInitials = (nombreUsuario?: string): string => {
  const trimmed = nombreUsuario?.trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/);

  const initials =
    words.length >= 2 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2);

  return initials.toUpperCase();
};
