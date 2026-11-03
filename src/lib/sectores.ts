import type { CSSProperties } from 'react';
import { SectorUsuario } from '../shared/types';

export interface SectorConfig {
  codigo: SectorUsuario;
  label: string;
  color: string;
}

// Single source of truth for sector label and color. There is no sector table:
// the list is hardcoded and the user stores only the code in datosAdicionales.sector.
export const SECTORES: readonly SectorConfig[] = [
  { codigo: SectorUsuario.OFICIALES, label: 'Oficiales', color: '#f97316' },
  { codigo: SectorUsuario.SUPERVISORES, label: 'Supervisores', color: '#166534' },
  { codigo: SectorUsuario.CONTROL_CALIDAD, label: 'Control de Calidad', color: '#800020' },
  { codigo: SectorUsuario.MEJORA_CONTINUA, label: 'Mejora Continua', color: '#7e22ce' },
];

// Defensive fallback for users that still have no sector.
export const SECTOR_NEUTRAL_COLOR = '#9ca3af';

const findSector = (codigo?: string | null) => SECTORES.find((s) => s.codigo === codigo);

export const getSectorColor = (codigo?: string | null): string =>
  findSector(codigo)?.color ?? SECTOR_NEUTRAL_COLOR;

export const getSectorLabel = (codigo?: string | null): string | null =>
  findSector(codigo)?.label ?? null;

export interface SectorAvatarProps {
  className: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Color classes, inline style and tooltip for a user avatar: filled with the sector color when the
 * user has a known sector, otherwise the neutral look the avatars always had.
 */
export const getSectorAvatarProps = (codigo?: string | null): SectorAvatarProps => {
  const sector = findSector(codigo);
  if (!sector) return { className: 'bg-secondary text-secondary-foreground' };
  return { className: 'text-white', style: { backgroundColor: sector.color }, title: sector.label };
};
