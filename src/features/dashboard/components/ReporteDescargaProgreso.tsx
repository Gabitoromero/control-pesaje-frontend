import { Check, Download, FileSpreadsheet, Loader2, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ReporteDescargaFase = 'generando' | 'descargando';

type EstadoPaso = 'hecho' | 'actual' | 'pendiente';

interface Paso {
  label: string;
  icon: LucideIcon;
}

const PASOS: Paso[] = [
  { label: 'Solicitud enviada', icon: Send },
  { label: 'Generando reporte', icon: FileSpreadsheet },
  { label: 'Descargando archivo', icon: Download },
];

// The request is already sent by the time the dialog shows this view, so the first step is always done.
const PASO_ACTUAL: Record<ReporteDescargaFase, number> = { generando: 1, descargando: 2 };

const CIRCULO: Record<EstadoPaso, string> = {
  hecho: 'border-brand bg-brand text-primary-foreground',
  actual: 'border-brand bg-brand-muted text-brand',
  pendiente: 'border-border bg-secondary text-muted-foreground',
};

const MENSAJE: Record<ReporteDescargaFase, { titulo: string; detalle: string }> = {
  generando: {
    titulo: 'Generando el reporte en el servidor...',
    detalle:
      'El servidor recibió la solicitud y está procesando los datos. Con rangos largos puede demorar varios minutos; no cierres esta ventana.',
  },
  descargando: {
    titulo: 'Reporte listo, descargando el archivo...',
    detalle: 'La descarga comenzará en unos instantes.',
  },
};

/**
 * Replaces the date form of the download dialog while the report is generated and downloaded:
 * a large spinner, a stepper in the same visual language as the login stepper, and the phase message.
 */
export function ReporteDescargaProgreso({ fase }: { fase: ReporteDescargaFase }) {
  const actual = PASO_ACTUAL[fase];
  const { titulo, detalle } = MENSAJE[fase];

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <Loader2 className="h-20 w-20 animate-spin text-primary" aria-hidden="true" />

      <ol aria-label="Progreso de la descarga" className="flex w-full items-start">
        {PASOS.map(({ label, icon: Icon }, index) => {
          const estado: EstadoPaso = index < actual ? 'hecho' : index === actual ? 'actual' : 'pendiente';
          return (
            <li
              key={label}
              data-state={estado}
              aria-current={estado === 'actual' ? 'step' : undefined}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-5 h-1 w-full -translate-y-1/2 transition-colors duration-150 ${
                    estado === 'pendiente' ? 'bg-secondary' : 'bg-brand'
                  }`}
                />
              )}
              <span className="relative z-10 rounded-full bg-card">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-150 ${CIRCULO[estado]}`}
                >
                  {estado === 'hecho' ? <Check size={22} /> : <Icon size={22} />}
                </span>
              </span>
              <span
                className={`text-center text-xs ${estado === 'pendiente' ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite" className="flex flex-col gap-1 text-center text-sm">
        <span className="font-semibold text-foreground">{titulo}</span>
        <span className="text-muted-foreground">{detalle}</span>
      </div>
    </div>
  );
}
