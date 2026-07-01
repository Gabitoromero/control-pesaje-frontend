import React, { createContext, useContext } from 'react';
import { useMuestrasLibres } from '../hooks/useMuestrasLibres';
import type { UseMuestrasLibresResult, UseMuestrasLibresProps } from '../hooks/useMuestrasLibres';
//import type { RutaPasadaEtapa } from '../../../shared/types/domain';

// Re-export the value shape so consumers can type-reference it
export type MuestrasLibresContextValue = UseMuestrasLibresResult;

const MuestrasLibresContext = createContext<MuestrasLibresContextValue | null>(null);

export interface MuestrasLibresProviderProps extends UseMuestrasLibresProps {
  children: React.ReactNode;
}

export function MuestrasLibresProvider({
  children,
  lineaProduccionId,
  usuarioId,
  etapas,
  onApiError,
}: MuestrasLibresProviderProps) {
  const value = useMuestrasLibres({ lineaProduccionId, usuarioId, etapas, onApiError });

  return (
    <MuestrasLibresContext.Provider value={value}>
      {children}
    </MuestrasLibresContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMuestrasLibresContext(): MuestrasLibresContextValue {
  const ctx = useContext(MuestrasLibresContext);
  if (ctx === null) {
    throw new Error('useMuestrasLibresContext must be used within a MuestrasLibresProvider');
  }
  return ctx;
}
