import api from './axios.ts';

export async function downloadReportePasadasMuestras(desde: string, hasta: string): Promise<void> {
  const response = await api.get('/reportes/pasadas-muestras', {
    params: { desde, hasta },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reporte-${desde.split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
