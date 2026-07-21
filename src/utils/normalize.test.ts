import { describe, it, expect } from 'vitest';
import { normalizeForSearch } from './normalize';

describe('normalizeForSearch', () => {
  it('removes diacritics from accented Latin characters', () => {
    expect(normalizeForSearch('Ácido')).toBe('acido');
    expect(normalizeForSearch('café')).toBe('cafe');
    expect(normalizeForSearch('NÚMEROS')).toBe('numeros');
  });

  it('lowercases uppercase and mixed-case strings', () => {
    expect(normalizeForSearch('ACIDO')).toBe('acido');
    expect(normalizeForSearch('AcIdO')).toBe('acido');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeForSearch('  acido  ')).toBe('acido');
  });

  it('returns empty string for empty or whitespace-only input', () => {
    expect(normalizeForSearch('')).toBe('');
    expect(normalizeForSearch('   ')).toBe('');
  });

  it('preserves digits and basic punctuation', () => {
    expect(normalizeForSearch('Artículo 123')).toBe('articulo 123');
  });

  it('handles Ñ correctly (decomposed to N + combining tilde, then stripped)', () => {
    expect(normalizeForSearch('ESPAÑA')).toBe('espana');
  });
});
