# Exploration: MVP Frontend Structure — Controlador de Pesaje

Este documento define la arquitectura, diseño estructural de carpetas, servicios técnicos clave, hooks customizados y componentes premium requeridos para el frontend del **Controlador de Pesaje**. La especificación está alineada al 100% con la verdad de negocio e infraestructura relacional documentada en el backend.

---

## 1. Estructura de Directorios

Se adopta una arquitectura **Feature-Driven (Modular por Features)**. Esta organización aísla por completo los dos dominios del sistema (el flujo industrial de la Tablet de Planta y el flujo administrativo del Dashboard de Supervisores), compartiendo componentes genéricos de UI e infraestructura técnica en el nivel raíz.

Además, respeta estrictamente la **Regla de Oro de Idiomas (Ubiquitous Language)** del proyecto:
- **Infraestructura y Código Técnico en INGLÉS** (`services`, `hooks`, `components`, `LineMonitorCard`, `useWebSocket`).
- **Dominio del Negocio y Base de Datos en ESPAÑOL** (`linea_produccion`, `muestra`, `pasada`, `peso_neto`, `estado_validacion`).

```text
src/
├── api/                             # Infraestructura de comunicaciones
│   ├── axios.ts                     # Cliente Axios con interceptor JWT
│   └── endpoints.ts                 # Constantes de rutas API REST
├── assets/                          # Recursos estáticos (logos, sonidos de alerta)
├── components/                      # UI Components reutilizables de bajo nivel
│   └── ui/                          # Componentes básicos (Button, Dialog, Card, Badge)
├── features/                        # Módulos auto-contenidos de dominio de negocio
│   ├── auth/                        # Autenticación, PIN login táctil de planta
│   │   ├── components/              # Teclado numérico físico/táctil
│   │   └── context/                 # AuthContext (roles, tokens, línea asignada)
│   ├── dashboard/                   # Monitoreo Web de Supervisores y Calidad
│   │   ├── components/              # LineMonitorCard, ControlChart, MuestraAzarModal
│   │   ├── hooks/                   # useDashboardTelemetry
│   │   └── pages/                   # DashboardPage, AuditoriaPage
│   ├── reports/                     # Módulo de exportación analítica
│   │   ├── services/                # excelReportService
│   │   └── pages/                   # ReportsPage (filtros de fecha, descargas)
│   └── tablet/                      # Interfaz táctil de operarios en planta
│       ├── components/              # WeightVisualizer, StageGuide, AbortPasadaDialog
│       ├── hooks/                   # useBalanzaWebSocket, usePasadaState
│       └── pages/                   # TabletWorkspacePage, PasadasHistoryPage
├── hooks/                           # Custom hooks técnicos globales (useLocalStorage, etc.)
├── layouts/                         # Estructuras de layouts para React Router v7
│   ├── DashboardLayout.tsx          # Layout con barra de navegación lateral para supervisores
│   └── TabletLayout.tsx             # Layout optimizado para fullscreen táctil y bloqueo por red
├── services/                        # Servicios técnicos transversales
│   └── websocket.ts                 # Administrador base de sockets
├── shared/                          # Recursos compartidos y utilidades de negocio
│   ├── constants/                   # Tolerancias globales, nombres de estados
│   ├── types/                       # Interfaces TypeScript de entidades de base de datos
│   └── utils/                       # Helpers matemáticos (desviación estándar)
├── App.tsx                          # Definición de rutas y Context Providers
├── index.css                        # Estilos globales y Tailwind CSS
└── main.tsx                         # Punto de entrada de la aplicación
```

---

## 2. Servicios Técnicos Clave

### A. Gestión de Red y Conectividad (Axios + React Query)
Para cumplir con la **Regla de Negocio "Sin Estado Offline" (B)**, el cliente de Axios configurado en `src/api/axios.ts` debe propagar fallas de red de inmediato al gestor de estados React Query, evitando reintentos infinitos que enmascaren la desconexión física.

```typescript
// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 5000, // Timeout estricto para evitar esperas en entornos industriales
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### B. Servicio de Reportes Analíticos (Excel)
El módulo `src/features/reports/services/excelReportService.ts` consume los endpoints de descarga del backend como blobs y gestiona la descarga física directa en el navegador.

```typescript
// src/features/reports/services/excelReportService.ts
import api from '../../../api/axios';

export const downloadReport = async (
  reportType: 'rendimiento' | 'trazabilidad' | 'calidad',
  filters: { fechaInicio: string; fechaFin: string; extraId?: number }
) => {
  const response = await api.post(
    `/reportes/descargar/${reportType}`,
    filters,
    { responseType: 'blob' }
  );
  
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const fileName = `Reporte_${reportType}_${filters.fechaInicio}_a_${filters.fechaFin}.xlsx`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

---

## 3. Custom Hooks de Control de Pesaje

### A. Telemetría de Balanza en Tiempo Real (`useBalanzaWebSocket`)
Este hook encapsula la conexión física vía WebSockets a la balanza asociada a la línea de la Tablet. Expone el peso continuo y el estado de conectividad en tiempo real. 

Si la red se cae, el hook cambia el estado de conexión a `false`, disparando un bloqueo total en la UI (RF-01, RN-14).

```typescript
// src/features/tablet/hooks/useBalanzaWebSocket.ts
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TelemetryData {
  peso_neto: number; // en gramos, transmitido continuamente
  estable: boolean;   // indicador de estabilidad de la balanza
}

export const useBalanzaWebSocket = (lineaId: number) => {
  const [pesoNeto, setPesoNeto] = useState<number>(0.0);
  const [isEstable, setIsEstable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    
    // Conexión específica a la sala de la línea de producción
    const socket = io(wsUrl, {
      query: { lineaId: lineaId.toString() },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setPesoNeto(0.0); // Reset por seguridad ante desconexión
    });

    // Telemetría cruda en tiempo real desde la Raspberry Pi
    socket.on('telemetria_peso', (data: TelemetryData) => {
      // Filtrado físico de pesos negativos (RN-08)
      const pesoFiltrado = data.peso_neto < 0 ? 0.0 : data.peso_neto;
      setPesoNeto(pesoFiltrado);
      setIsEstable(data.estable);
    });

    return () => {
      socket.disconnect();
    };
  }, [lineaId]);

  return { pesoNeto, isEstable, isConnected };
};
```

### B. Control del Estado de Pesaje Secuencial (`usePasadaState`)
Mantiene el estado local de la etapa en curso de la receta, verificando las tolerancias físicas en tiempo real y garantizando que no se puedan saltar etapas (RN-12, RN-13, RF-06).

```typescript
// src/features/tablet/hooks/usePasadaState.ts
import { useState, useMemo } from 'react';
import { Muestra, RutaPasadaEtapa } from '../../../shared/types';

export const usePasadaState = (
  etapasConfig: RutaPasadaEtapa[],
  currentEtapaIndex: number,
  onEtapaComplete: () => void
) => {
  // Lista de muestras guardadas localmente en la etapa actual antes de cerrarse
  const [muestrasLocales, setMuestrasLocales] = useState<Muestra[]>([]);

  const etapaActual = etapasConfig[currentEtapaIndex];

  // Cálculo en tiempo real de muestras OK válidas contra las tolerancias de la receta
  const muestrasValidasOK = useMemo(() => {
    return muestrasLocales.filter(m => m.estado_validacion === 'ok');
  }, [muestrasLocales]);

  // Cantidad acumulada de muestras requeridas
  const cantidadRequerida = etapaActual?.cantidad_muestras_requeridas || 0;
  const isEtapaListaParaCerrar = muestrasValidasOK.length >= cantidadRequerida;

  // Registrar muestra localmente
  const addMuestraLocal = (peso: number, operarioId: number, lineaId: number, articuloId?: number) => {
    const min = etapaActual.peso_minimo;
    const max = etapaActual.peso_maximo;
    const esValida = peso >= min && peso <= max;

    const nuevaMuestra: Muestra = {
      id: Date.now(), // ID temporal local
      peso_neto: peso,
      estado_validacion: esValida ? 'ok' : 'fuera_de_rango',
      usuario_id: operarioId,
      etapa_id: etapaActual.etapa_id,
      linea_produccion_id: lineaId,
      articulo_id: articuloId,
      timestamp: new Date(),
    };

    setMuestrasLocales(prev => [...prev, nuevaMuestra]);
  };

  // Descarte manual de una muestra incorrecta antes de cerrar la etapa (RF-06)
  const removeMuestraLocal = (id: number) => {
    setMuestrasLocales(prev => prev.filter(m => m.id !== id));
  };

  return {
    muestrasLocales,
    muestrasValidasOKCount: muestrasValidasOK.length,
    cantidadRequerida,
    isEtapaListaParaCerrar,
    addMuestraLocal,
    removeMuestraLocal,
    etapaActual,
  };
};
```

---

## 4. Componentes Premium Reutilizables

### A. Visualizador de Peso de Alta Fidelidad (`WeightVisualizer`)
Diseñado para la Tablet de Planta. Cuenta con tipografía monoespaciada para evitar saltos ópticos, colores reactivos según la tolerancia de la etapa activa y una barra de escala analógica dinámica de peso.

```tsx
// src/features/tablet/components/WeightVisualizer.tsx
import React from 'react';

interface WeightVisualizerProps {
  pesoActual: number;      // Telemetría en tiempo real
  pesoIdeal: number;       // Parámetro de receta
  pesoMinimo: number;      // Tolerancia inferior
  pesoMaximo: number;      // Tolerancia superior
  isEstable: boolean;      // Estabilidad física del sensor
}

export const WeightVisualizer: React.FC<WeightVisualizerProps> = ({
  pesoActual,
  pesoIdeal,
  pesoMinimo,
  pesoMaximo,
  isEstable,
}) => {
  // Determinación de color del visor
  let colorVisor = 'text-blue-500'; // Por defecto o inactivo (Puesta a punto)
  
  if (pesoActual > 0) {
    if (pesoActual < pesoMinimo) colorVisor = 'text-amber-500'; // Muy bajo
    else if (pesoActual > pesoMaximo) colorVisor = 'text-red-500';   // Muy alto
    else colorVisor = 'text-emerald-500'; // Rango OK
  }

  // Porcentaje del peso actual respecto al ideal para la barra analógica
  const porcentajeVisual = Math.min((pesoActual / (pesoMaximo * 1.2)) * 100, 100);
  const porcentajeMinimo = (pesoMinimo / (pesoMaximo * 1.2)) * 100;
  const porcentajeMaximo = (pesoMaximo / (pesoMaximo * 1.2)) * 100;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden">
      {/* Indicador de estabilidad de balanza */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Balanza IoT Telemetría</span>
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${isEstable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-xs text-slate-400 font-semibold">{isEstable ? 'Estable' : 'Capturando...'}</span>
        </div>
      </div>

      {/* Visor digital gigante de peso en gramos */}
      <div className="text-center my-auto">
        <span className={`text-8xl font-mono font-bold tracking-tight select-none transition-colors duration-200 ${colorVisor}`}>
          {pesoActual.toFixed(3)}
        </span>
        <span className="text-3xl text-slate-500 ml-2 font-semibold">g</span>
      </div>

      {/* Escala analógica del peso en tiempo real */}
      <div className="w-full mt-4">
        <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          {/* Zona de Tolerancia Mínima a Máxima (Sombreado de referencia OK) */}
          <div 
            className="absolute h-full bg-emerald-950/40 border-l border-r border-emerald-500/30"
            style={{ left: `${porcentajeMinimo}%`, right: `${100 - porcentajeMaximo}%` }}
          />
          {/* Barra indicadora del peso neto actual */}
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-75"
            style={{ width: `${porcentajeVisual}%` }}
          />
        </div>
        
        {/* Marcadores de referencia físicos de la receta */}
        <div className="flex justify-between text-xs text-slate-500 font-medium px-1 mt-2">
          <span>Min: {pesoMinimo.toFixed(1)}g</span>
          <span className="text-slate-400 font-semibold">Ideal: {pesoIdeal.toFixed(1)}g</span>
          <span>Max: {pesoMaximo.toFixed(1)}g</span>
        </div>
      </div>
    </div>
  );
};
```

### B. Tarjeta de Monitoreo de Línea (`LineMonitorCard`)
Componente premium optimizado para el Dashboard de Supervisores (monitoreo de las ~13 líneas físicas simultáneas).

```tsx
// src/features/dashboard/components/LineMonitorCard.tsx
import React from 'react';
import { Play, Activity, Clock, User } from 'lucide-react';

interface LineMonitorCardProps {
  nombreLinea: string;
  numeroBalanza: number;
  recetaActiva?: string;
  operario?: string;
  avanceOK: number;
  avanceRequerido: number;
  ultimoPeso: number;
  porcentajeEfectividad: number; // Porcentaje de muestras OK vs fuera_de_rango
  enPuestaAPunto: boolean;
}

export const LineMonitorCard: React.FC<LineMonitorCardProps> = ({
  nombreLinea,
  numeroBalanza,
  recetaActiva,
  operario,
  avanceOK,
  avanceRequerido,
  ultimoPeso,
  porcentajeEfectividad,
  enPuestaAPunto,
}) => {
  if (enPuestaAPunto) {
    return (
      <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-400 text-lg">{nombreLinea}</h3>
            <p className="text-xs text-slate-600">Balanza #{numeroBalanza}</p>
          </div>
          <span className="bg-slate-800 text-slate-500 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            Puesta a Punto
          </span>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 italic">Descartando telemetría automática (RN-14)</p>
        </div>
        <div className="flex items-center space-x-1 text-xs text-slate-600 font-medium">
          <Clock size={14} />
          <span>Línea inactiva</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-200 text-lg">{nombreLinea}</h3>
          <p className="text-xs text-slate-500">Balanza #{numeroBalanza}</p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold">
          <Activity size={12} className="animate-pulse" />
          <span>EN CURSO</span>
        </span>
      </div>

      <div className="my-4 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Receta</p>
            <p className="text-sm font-semibold text-slate-300">{recetaActiva}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Último: </span>
            <span className="text-base font-mono font-bold text-emerald-400">{ultimoPeso.toFixed(3)}g</span>
          </div>
        </div>

        {/* Avance físico de muestras en la etapa */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-400">Avance Etapa</span>
            <span className="text-slate-300">{avanceOK} / {avanceRequerido} OK</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((avanceOK / avanceRequerido) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-800">
        <div className="flex items-center space-x-1.5 font-medium">
          <User size={14} className="text-slate-600" />
          <span>{operario}</span>
        </div>
        <div className="font-semibold text-slate-400">
          Rendimiento: <span className={porcentajeEfectividad >= 90 ? 'text-emerald-500' : 'text-amber-500'}>{porcentajeEfectividad}% OK</span>
        </div>
      </div>
    </div>
  );
};
```

### C. Gráfico Estadístico de Control (`ControlChart`)
Gráfico que muestra las muestras individuales contra las líneas horizontales de tolerancia, calculando la dispersión.

```tsx
// src/features/dashboard/components/ControlChart.tsx
import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MuestraGrafico {
  timestamp: string;
  peso_neto: number;
}

interface ControlChartProps {
  muestras: MuestraGrafico[];
  pesoIdeal: number;
  pesoMinimo: number;
  pesoMaximo: number;
}

export const ControlChart: React.FC<ControlChartProps> = ({
  muestras,
  pesoIdeal,
  pesoMinimo,
  pesoMaximo,
}) => {
  // Cálculo de Desviación Estándar de la muestra
  const estadisticas = useMemo(() => {
    if (muestras.length === 0) return { promedio: 0, desviacion: 0 };
    
    const pesos = muestras.map(m => m.peso_neto);
    const suma = pesos.reduce((acc, v) => acc + v, 0);
    const promedio = suma / pesos.length;
    
    const sumaVarianzas = pesos.reduce((acc, v) => acc + Math.pow(v - promedio, 2), 0);
    const desviacion = Math.sqrt(sumaVarianzas / pesos.length);

    return { promedio, desviacion };
  }, [muestras]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-slate-200 text-lg">Gráfico de Control Estadístico</h3>
          <p className="text-xs text-slate-500">Muestras pesadas en secuencia contra límites de receta</p>
        </div>
        <div className="flex space-x-4 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Promedio</span>
            <span className="text-sm font-mono font-bold text-blue-400">{estadisticas.promedio.toFixed(3)}g</span>
          </div>
          <div className="w-[1px] bg-slate-800 self-stretch" />
          <div className="text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Desvío Estándar</span>
            <span className="text-sm font-mono font-bold text-purple-400">±{estadisticas.desviacion.toFixed(3)}g</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={muestras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timestamp" tick={{ fill: '#64748b', fontSize: 10 }} stroke="#334155" />
            <YAxis 
              domain={[Math.floor(pesoMinimo * 0.9), Math.ceil(pesoMaximo * 1.1)]} 
              tick={{ fill: '#64748b', fontSize: 10 }}
              stroke="#334155"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
            />
            
            {/* Referencias Horizontales de Tolerancia */}
            <ReferenceLine y={pesoIdeal} stroke="#10b981" strokeWidth={2} label={{ value: 'Ideal', fill: '#10b981', position: 'insideRight' }} />
            <ReferenceLine y={pesoMinimo} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Mínimo', fill: '#f59e0b', position: 'insideRight' }} />
            <ReferenceLine y={pesoMaximo} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Máximo', fill: '#ef4444', position: 'insideRight' }} />
            
            {/* Curva de muestras registradas */}
            <Line 
              type="monotone" 
              dataKey="peso_neto" 
              name="Peso Muestra"
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

---

## 5. Estrategia de Flujo de Negocio para el MVP

### A. Pantalla del Operario (Tablet)
1. **Login de Operario:** El operario ingresa mediante teclado numérico táctil optimizado para pantalla táctil de Tablet de planta (Login de 8 dígitos/PIN).
2. **Selección de Línea:** Al iniciar sesión en la Tablet, esta queda bloqueada a una única línea física de producción (**RN-03, RN-16**).
3. **Inicio de Pasada (Lote diario):** 
   - El sistema detecta la receta activa en la línea (**RN-02**). Si no hay receta activa, queda en "Modo Puesta a Punto", impidiendo registros (**RN-14**).
   - Muestra el listado de lotes diarios en curso. El operario puede iniciar una nueva pasada o tomar el relevo de un compañero en una pasada existente (**RF-08, RF-09**).
4. **Flujo de Pesaje Secuencial de Etapas:**
   - La Tablet muestra la etapa actual de la receta física en curso.
   - Recibe telemetría de peso de la balanza en tiempo real vía WebSocket.
   - El operario realiza la calibración de la tara de la etapa actual una única vez presionando el botón físico/virtual de "Tarar" (**RN-08**).
   - Cuando el producto está listo, el operario presiona "Confirmar Peso" (**RF-02**).
   - Las muestras se validan localmente y se transmiten al backend para su almacenamiento. Si una muestra queda fuera de las tolerancias fijadas en `ruta_pasada_etapa`, la muestra se guarda con estado `fuera_de_rango` (trazabilidad del desperdicio), pero **no se cuenta** para completar las muestras requeridas de la etapa (**RN-13**).
   - El operario puede descartar/eliminar una muestra registrada de la etapa en curso en caso de error involuntario antes de finalizar la etapa (**RF-06**).
   - Completada la cantidad de muestras OK exigidas, el sistema desbloquea la siguiente etapa. No se puede avanzar si hay etapas previas incompletas (**RN-12**).
5. **Cierre de Pasada:** 
   - La pasada finaliza con estado `completa` cuando todas las etapas del pesaje secuencial se han cubierto.
   - Abortar una pasada requiere presionar "Abortar Pasada", ingresar obligatoriamente un texto con el **motivo del cierre** y **validar el PIN** con un usuario con rol de Supervisor/Calidad (**RN-11, RN-15**).

### B. Dashboard de Monitoreo (Web)
1. **Monitoreo en Tiempo Real:** El supervisor visualiza simultáneamente el estado de las ~13 líneas en un grid con tarjetas reactivas que reflejan el peso actual, operario a cargo y porcentaje de avance de muestras.
2. **Auditoría Preventiva al Azar (Calidad):**
   - El inspector de calidad puede registrar muestras al azar preventivas en cualquier momento seleccionando la línea de producción correspondiente sin necesidad de que haya una pasada de lote activa (**RN-17**).
   - En este flujo preventivo, la selección del artículo comercial comercializado es **opcional/nullable** (**RN-17**).
3. **Control Estadístico:** Los supervisores auditan las curvas de peso de las pasadas en vivo con gráficos de control estadísticos que visualizan tolerancias e índices de dispersión de peso (Desvío Estándar).
4. **Exportaciones Excel:** Descarga de reportes operativos listos en formato `.xlsx` siguiendo los tres focos analíticos del negocio: Rendimiento físico y desperdicio, Trazabilidad comercial e Historial de lotes, y Auditorías al azar de calidad (Reportes A, B y C).
