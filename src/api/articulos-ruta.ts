import api from './axios';

export interface ArticuloRutaPasadaItem {
  id: number;
  articulo: {
    id: number;
    nombre: string;
    marca?: string;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** List all articulo-ruta pivot records, optionally filtered by rutaPasadaId. */
export const getArticulosDeRuta = async (rutaPasadaId?: number): Promise<ArticuloRutaPasadaItem[]> => {
  const params = rutaPasadaId ? { rutaPasadaId } : {};
  const response = await api.get<ApiEnvelope<ArticuloRutaPasadaItem[]>>('/rutas-pasadas-articulos', { params });
  return response.data.data;
};

/** Assign an articulo to a ruta (create pivot record). */
export const addArticuloARuta = async (rutaPasadaId: number, articuloId: number): Promise<ArticuloRutaPasadaItem> => {
  const response = await api.post<ApiEnvelope<ArticuloRutaPasadaItem>>('/rutas-pasadas-articulos', {
    rutaPasada: rutaPasadaId,
    articulo: articuloId,
  });
  return response.data.data;
};

/** Remove an articulo from a ruta (hard delete of pivot record). */
export const removeArticuloDeRuta = async (pivotId: number): Promise<void> => {
  await api.delete(`/rutas-pasadas-articulos/${pivotId}`);
};
