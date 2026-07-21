/**
 * Accent- and case-insensitive normalization for substring search.
 *
 * Decomposes accented characters via NFD, strips the Unicode combining-mark
 * range (accents/diacritics), lowercases, and trims. This is the standard
 * approach for matching "acido" against "Ácido" without an external library.
 */
export const normalizeForSearch = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};
