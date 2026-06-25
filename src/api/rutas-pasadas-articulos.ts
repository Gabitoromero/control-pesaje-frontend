import api from './axios';
import type { Articulo } from './articulos';
import type { ArticuloRutaPasadaItem } from '../shared/types/domain';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getArticulosPorRuta = async (rutaPasadaId: number): Promise<Articulo[]> => {
  const response = await api.get<ApiEnvelope<ArticuloRutaPasadaItem[]>>('/rutas-pasadas-articulos', {
    params: { rutaPasadaId }
  });
  return response.data.data.map(item => item.articulo);
};
