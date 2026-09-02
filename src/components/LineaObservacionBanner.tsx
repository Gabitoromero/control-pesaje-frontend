import { Info } from 'lucide-react';

interface LineaObservacionBannerProps {
  observacion: string | null | undefined;
}

/**
 * Informative banner shown wherever a línea de producción's context is
 * visible (tablet "Planta" pages: GestionPasadasPage, TabletWorkspace,
 * MuestrasLibresPage; dashboard: MonitoreoPage/MonitoreoFullscreenPage)
 * whenever the active línea carries a non-null observación. Visual language
 * matches the dashboard's blocking "actividad" banners, but this one is
 * informative — Info icon, not AlertTriangle — and never disables anything.
 */
export function LineaObservacionBanner({ observacion }: LineaObservacionBannerProps) {
  if (!observacion) return null;

  return (
    <div className="flex items-start gap-3 bg-warning/10 border border-warning/50 rounded-2xl p-5">
      <Info size={20} className="text-warning mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-warning text-sm">Observación de la línea</p>
        <p className="text-warning/80 text-sm mt-1">{observacion}</p>
      </div>
    </div>
  );
}
