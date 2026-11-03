import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import api from './axios';
import {
  downloadReporteMuestras,
  downloadReportePasadas,
  downloadReporteRutasPasada,
  todayLocalIso,
} from './reportes';

const BASE = 'http://localhost:3000/api';

const server = setupServer();

describe('reportes API', () => {
  let downloads: string[];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    downloads = [];
    createObjectURL = vi.fn(() => 'blob:fake');
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.getAttribute('download') ?? '');
    });
  });
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });
  afterAll(() => server.close());

  it('todayLocalIso formats the local date, not UTC', () => {
    expect(todayLocalIso(new Date(2026, 9, 8, 23, 30))).toBe('2026-10-08');
  });

  it('downloadReporteRutasPasada fetches the blob and saves it with a dated filename', async () => {
    let hit = false;
    server.use(
      http.get(`${BASE}/reportes/rutas-pasada`, () => {
        hit = true;
        return new HttpResponse(new Uint8Array([1, 2, 3]), {
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      }),
    );

    await downloadReporteRutasPasada();

    expect(hit).toBe(true);
    expect(downloads).toEqual([`reporte-rutas-pasada-${todayLocalIso()}.xlsx`]);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it.each([
    ['muestras', downloadReporteMuestras],
    ['pasadas', downloadReportePasadas],
  ] as const)('download of the %s report uses its endpoint, shared params and filename', async (path, download) => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(`${BASE}/reportes/${path}`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return new HttpResponse(new Uint8Array([1]), {
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      }),
    );

    await download('2026-10-01', '2026-10-03');

    expect(query?.get('desde')).toBe('2026-10-01');
    expect(query?.get('hasta')).toBe('2026-10-03');
    expect(downloads).toEqual([`reporte-${path}-2026-10-01.xlsx`]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('range reports disable the axios timeout so large ranges are not aborted', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: new Uint8Array([1]) });

    await downloadReporteMuestras('2026-10-01', '2026-12-29');

    expect(get).toHaveBeenCalledWith(
      '/reportes/muestras',
      expect.objectContaining({ timeout: 0, responseType: 'blob' }),
    );
  });

  it('notifies once when the server starts sending the file', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (_url, config) => {
      config?.onDownloadProgress?.({ loaded: 1, bytes: 1 } as never);
      config?.onDownloadProgress?.({ loaded: 2, bytes: 1 } as never);
      return { data: new Uint8Array([1]) };
    });
    const onStart = vi.fn();

    await downloadReportePasadas('2026-10-01', '2026-10-03', onStart);

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
