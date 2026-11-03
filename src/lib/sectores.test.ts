import { describe, it, expect } from 'vitest';
import { SECTORES, SECTOR_NEUTRAL_COLOR, getSectorColor, getSectorLabel } from './sectores';

describe('sectores config', () => {
  it('defines the four sectors with code, label and color, in order', () => {
    expect(SECTORES.map((s) => [s.codigo, s.label])).toEqual([
      ['OF', 'Oficiales'],
      ['SU', 'Supervisores'],
      ['DD', 'Control de Calidad'],
      ['MC', 'Mejora Continua'],
    ]);
  });

  it('gives every sector a distinct color', () => {
    const colors = SECTORES.map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
    expect(colors).not.toContain(SECTOR_NEUTRAL_COLOR);
  });

  it('resolves color and label by code', () => {
    expect(getSectorColor('OF')).toBe(SECTORES[0].color);
    expect(getSectorLabel('MC')).toBe('Mejora Continua');
  });

  it('falls back to a neutral color when the user has no sector or an unknown one', () => {
    expect(getSectorColor(null)).toBe(SECTOR_NEUTRAL_COLOR);
    expect(getSectorColor(undefined)).toBe(SECTOR_NEUTRAL_COLOR);
    expect(getSectorColor('ZZ')).toBe(SECTOR_NEUTRAL_COLOR);
    expect(getSectorLabel(null)).toBeNull();
  });
});
