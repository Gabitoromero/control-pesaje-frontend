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

export async function downloadReportePasadasMuestras(desde: string, hasta: string): Promise<void> {
  const response = await api.get('/reportes/pasadas-muestras', {
    params: { desde, hasta },
    responseType: 'blob',
  });
  saveBlobAsFile(response.data, `reporte-${desde.split('T')[0]}.xlsx`);
}

export async function downloadReporteRutasPasada(): Promise<void> {
  const response = await api.get('/reportes/rutas-pasada', { responseType: 'blob' });
  saveBlobAsFile(response.data, `reporte-rutas-pasada-${todayLocalIso()}.xlsx`);
}
