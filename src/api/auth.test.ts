import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loginApi,
  abrirSesionLinea,
  actualizarActividad,
  getSesionActiva,
  cerrarSesionLinea,
} from './auth';
import api from './axios';

vi.mock('./axios', () => {
  return {
    default: {
      post: vi.fn(),
      patch: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loginApi llama a POST /auth/login y retorna token', async () => {
    const mockResponse = { data: { success: true, data: { token: 'jwt-123' } } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await loginApi({ legajo: '1234', pin: '1111' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { legajo: '1234', pin: '1111' });
    expect(result).toEqual({ token: 'jwt-123' });
  });

  it('abrirSesionLinea llama a POST /sesion-linea', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201 });

    await abrirSesionLinea(3);

    expect(api.post).toHaveBeenCalledWith('/sesion-linea', { lineaProduccionId: 3 });
  });

  it('actualizarActividad llama a PATCH /auth/actividad', async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200 });

    await actualizarActividad();

    expect(api.patch).toHaveBeenCalledWith('/auth/actividad');
  });

  it('getSesionActiva llama a GET /sesion-activa y retorna SesionActiva', async () => {
    const mockSesion = { lineaProduccionId: 1, usuarioId: 2, usuarioRol: 'OPERARIO', ultimaActividadAt: '2023' };
    vi.mocked(api.get).mockResolvedValue({ data: mockSesion });

    const result = await getSesionActiva();

    expect(api.get).toHaveBeenCalledWith('/sesion-activa');
    expect(result).toEqual(mockSesion);
  });

  it('cerrarSesionLinea llama a POST /cerrar-sesion', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 200 });

    await cerrarSesionLinea(3);

    expect(api.post).toHaveBeenCalledWith('/cerrar-sesion', { lineaProduccionId: 3 });
  });
});
