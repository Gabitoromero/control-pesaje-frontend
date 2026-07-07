import { describe, it, expect } from 'vitest';
import { getAvatarInitials } from './avatarInitials';

describe('getAvatarInitials', () => {
  it('derives initials from the first two words when 2+ words are present', () => {
    expect(getAvatarInitials('Juan Perez')).toBe('JP');
  });

  it('derives initials from the first two characters when only one word is present', () => {
    expect(getAvatarInitials('operario1')).toBe('OP');
  });

  it('uppercases the derived initials', () => {
    expect(getAvatarInitials('juan perez')).toBe('JP');
  });

  it('falls back to "?" for an empty string', () => {
    expect(getAvatarInitials('')).toBe('?');
  });

  it('falls back to "?" for undefined', () => {
    expect(getAvatarInitials(undefined)).toBe('?');
  });

  it('handles a single-character word', () => {
    expect(getAvatarInitials('a')).toBe('A');
  });

  it('ignores extra surrounding whitespace', () => {
    expect(getAvatarInitials('  Juan   Perez  ')).toBe('JP');
  });
});
