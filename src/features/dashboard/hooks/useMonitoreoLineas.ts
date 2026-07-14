import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardLineas,
  getDashboardResumen,
  getDashboardKpis,
  getDashboardEtapas,
  type DashboardLineaItem,
  type DashboardLineaResumen,
  type DashboardKpi,
  type DashboardEtapa,
} from '../../../api/dashboard';

export interface UseMonitoreoLineas {
  lineas: DashboardLineaItem[];
  lineaActual: DashboardLineaItem | null;
  resumen: DashboardLineaResumen | undefined;
  kpis: DashboardKpi | undefined;
  etapas: DashboardEtapa[];
  isEmpty: boolean;
  isLoading: boolean;
  lineaIndex: number;
  onLineaChange: (delta: 1 | -1) => void;
}

export function useMonitoreoLineas(): UseMonitoreoLineas {
  const [lineaIndex, setLineaIndex] = useState(0);

  const { data: allLineas = [] } = useQuery({
    queryKey: ['dashboard-lineas'],
    queryFn: getDashboardLineas,
    refetchInterval: 30000,
  });

  const lineas = useMemo(
    () => allLineas.filter((linea) => !!linea.rutaPasadaActiva),
    [allLineas]
  );

  const isEmpty = lineas.length === 0;

  useEffect(() => {
    if (lineaIndex >= lineas.length) {
      setLineaIndex(0);
    }
  }, [lineas.length, lineaIndex]);

  useEffect(() => {
    if (lineas.length <= 1) return;
    const interval = setInterval(() => {
      setLineaIndex((prev) => (prev + 1 >= lineas.length ? 0 : prev + 1));
    }, 60000);
    return () => clearInterval(interval);
  }, [lineas.length]);

  const lineaActual = lineas[lineaIndex] ?? null;
  const lineaId = lineaActual?.id;

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['dashboard-resumen', lineaId],
    queryFn: () => getDashboardResumen(lineaId as number),
    refetchInterval: 5000,
    enabled: lineaId !== undefined,
  });

  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis', lineaId],
    queryFn: () => getDashboardKpis(lineaId as number),
    refetchInterval: 10000,
    enabled: lineaId !== undefined,
  });

  const { data: etapas = [] } = useQuery({
    queryKey: ['dashboard-etapas', lineaId],
    queryFn: () => getDashboardEtapas(lineaId as number),
    refetchInterval: 5000,
    enabled: lineaId !== undefined,
  });

  const onLineaChange = useCallback(
    (delta: 1 | -1) => {
      setLineaIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return lineas.length - 1;
        if (next >= lineas.length) return 0;
        return next;
      });
    },
    [lineas.length]
  );

  return {
    lineas,
    lineaActual,
    resumen,
    kpis,
    etapas,
    isEmpty,
    isLoading: lineaId !== undefined && loadingResumen,
    lineaIndex,
    onLineaChange,
  };
}
