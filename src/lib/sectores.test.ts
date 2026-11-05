import { describe, it, expect } from 'vitest';
import { SECTORES, SECTOR_NEUTRAL_COLOR, getSectorAvatarProps, getSectorColor, getSectorLabel } from './sectores';

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

  it('getSectorAvatarProps fills the avatar with the sector color and titles it with the label', () => {
    const props = getSectorAvatarProps('SU');
    expect(props.className).toContain('text-white');
    expect(props.style).toEqual({ backgroundColor: getSectorColor('SU') });
    expect(props.title).toBe('Supervisores');
  });

  it('getSectorAvatarProps keeps the neutral avatar look when there is no known sector', () => {
    [undefined, null, '', 'XX'].forEach((codigo) => {
      const props = getSectorAvatarProps(codigo);
      expect(props.className).toBe('bg-secondary text-secondary-foreground');
      expect(props.style).toBeUndefined();
      expect(props.title).toBeUndefined();
    });
  });
});
