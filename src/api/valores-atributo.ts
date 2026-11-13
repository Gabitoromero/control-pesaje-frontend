import api from './axios';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** A cualidad value already loaded for a pasada (never edited once loaded). */
export interface ValorAtributoCargado {
  id: number;
  /** FK ids: the backend does not populate the relations on this endpoint. */
  pasada: number;
  etapa: number;
  atributo: number;
  valor: number;
  nombre: string;
  tipo: 'numerico' | 'aceptado';
  minimo: number;
  maximo: number;
  estadoValidacion: 'ok' | 'fuera_de_rango';
}

export const getValoresAtributo = async (pasadaId: number): Promise<ValorAtributoCargado[]> => {
  const response = await api.get<ApiEnvelope<ValorAtributoCargado[]>>('/valores-atributo', { params: { pasadaId } });
  return response.data.data;
};

/** aceptado/no aceptado travels as 1 / 0 (the operator only sees the text). */
export const registrarValoresAtributo = async (data: {
  pasadaId: number;
  etapaId: number;
  valores: Array<{ atributoId: number; valor: number }>;
}): Promise<ValorAtributoCargado[]> => {
  const response = await api.post<ApiEnvelope<ValorAtributoCargado[]>>('/valores-atributo', data);
  return response.data.data;
};
