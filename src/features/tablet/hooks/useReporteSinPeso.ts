import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ReportePantalla, ReportResult } from './useBalanzaWebSocket';

// Mirrors the backend cooldown so a successful report disables the button
// without waiting for a second press to be rejected.
export const REPORTE_COOLDOWN_MS = 60_000;

export const MOTIVO_SIN_CONEXION = 'Sin conexión con el servidor';

export type EstadoReporte = 'idle' | 'enviando' | 'enfriamiento';

interface UseReporteSinPesoParams {
  socketConectado: boolean;
  enviar: (pantalla: ReportePantalla) => Promise<ReportResult>;
  pantalla: ReportePantalla;
}

export function useReporteSinPeso({ socketConectado, enviar, pantalla }: UseReporteSinPesoParams) {
  const [enviando, setEnviando] = useState(false);
  const [hastaMs, setHastaMs] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  // The tick only runs while a cooldown is active.
  useEffect(() => {
    if (hastaMs === null) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setAhora(now);
      if (now >= hastaMs) setHastaMs(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [hastaMs]);

  const segundosRestantes = hastaMs === null ? 0 : Math.max(0, Math.ceil((hastaMs - ahora) / 1000));
  const estado: EstadoReporte = enviando ? 'enviando' : hastaMs !== null ? 'enfriamiento' : 'idle';
  const deshabilitado = !socketConectado || estado !== 'idle';
  const motivoDeshabilitado = socketConectado ? undefined : MOTIVO_SIN_CONEXION;

  const iniciarEnfriamiento = (ms: number) => {
    const now = Date.now();
    setAhora(now);
    setHastaMs(now + ms);
  };

  const reportar = async () => {
    if (deshabilitado) return;
    setEnviando(true);
    const res = await enviar(pantalla);
    setEnviando(false);

    if (res.ok) {
      toast.success('Reporte enviado al equipo técnico');
      iniciarEnfriamiento(REPORTE_COOLDOWN_MS);
    } else if (res.code === 'cooldown') {
      iniciarEnfriamiento(res.retryAfterMs);
    } else {
      toast.error('No se pudo enviar el reporte. Intente nuevamente.');
    }
  };

  return { estado, segundosRestantes, deshabilitado, motivoDeshabilitado, reportar };
}
