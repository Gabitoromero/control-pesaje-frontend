import api from './axios.ts';

export function saveBlobAsFile(data: BlobPart, filename: string): void {
  const url = URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function todayLocalIso(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function downloadReporteConRango(
  path: 'muestras' | 'pasadas',
  desde: string,
  hasta: string,
  onResponseStart?: () => void,
): Promise<void> {
  let started = false;
  const response = await api.get(`/reportes/${path}`, {
    params: { desde, hasta },
    responseType: 'blob',
    // Ranges up to 90 days take a while to build: do not abort with the default 5s timeout.
    timeout: 0,
    // The server only starts sending once the workbook is built, so the first progress event
    // means the backend finished generating and the file is now being downloaded.
    onDownloadProgress: () => {
      if (started) return;
      started = true;
      onResponseStart?.();
    },
  });
  saveBlobAsFile(response.data, `reporte-${path}-${desde.split('T')[0]}.xlsx`);
}

export const downloadReporteMuestras = (
  desde: string,
  hasta: string,
  onResponseStart?: () => void,
): Promise<void> => downloadReporteConRango('muestras', desde, hasta, onResponseStart);

export const downloadReportePasadas = (
  desde: string,
  hasta: string,
  onResponseStart?: () => void,
): Promise<void> => downloadReporteConRango('pasadas', desde, hasta, onResponseStart);

export async function downloadReporteRutasPasada(): Promise<void> {
  const response = await api.get('/reportes/rutas-pasada', { responseType: 'blob' });
  saveBlobAsFile(response.data, `reporte-rutas-pasada-${todayLocalIso()}.xlsx`);
}
