import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { usePasadaState } from '../hooks/usePasadaState';
import { useActividadHeartbeat } from '../hooks/useActividadHeartbeat';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';
import { Scale, Trash2, CheckCircle2 } from 'lucide-react';

// Mock de etapa para desarrollo
const ETAPA_MOCK: RutaPasadaEtapa = {
  etapa_id: 1,
  nombre: 'Llenado Inicial',
  peso_minimo: 98,
  peso_maximo: 102,
  peso_ideal: 100,
  cantidad_muestras_requeridas: 10,
};

export const TabletWorkspace: React.FC = () => {
  const { user, closeLineSession, activeLineaId } = useAuth();
  
  // Heartbeat para mantener sesión viva en backend
  useActividadHeartbeat(activeLineaId || 0);

  if (!activeLineaId) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  const lineaId = activeLineaId;

  const { pesoNeto, isEstable, isConnected } = useBalanzaWebSocket(lineaId);

  // En producción, la etapa activa se obtendría del backend para la línea actual.
  const [etapaActiva] = useState<RutaPasadaEtapa | null>(ETAPA_MOCK);

  const {
    muestras,
    addSample,
    removeSample,
    clearPasada
  } = usePasadaState({
    usuarioId: user?.id ?? 0,
    lineaProduccionId: lineaId,
    etapaActiva,
    articuloId: 1, // Mock
  });

  const handleRegistrarMuestra = () => {
    if (isEstable && isConnected) {
      addSample(pesoNeto);
    }
  };

  const handleCerrarPasada = () => {
    // Aquí iría el POST al backend
    alert('Pasada cerrada. Muestras guardadas: ' + muestras.length);
    clearPasada();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50 gap-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Línea {lineaId}</h2>
          <p className="text-slate-500">Operario: {user?.nombreUsuario ?? 'Desconocido'}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <h3 className="text-lg font-semibold text-slate-700">
              {etapaActiva?.nombre ?? 'Sin Etapa'}
            </h3>
            <p className="text-slate-500">
              Muestras: {muestras.length} / {etapaActiva?.cantidad_muestras_requeridas ?? 0}
            </p>
          </div>
          <button
            onClick={() => closeLineSession()}
            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Balanza Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center">
          <Scale className={`w-24 h-24 mb-6 ${isConnected ? 'text-blue-500' : 'text-slate-300'}`} />
          
          <div className="text-center mb-8">
            <span className="text-8xl font-black text-slate-800 tabular-nums">
              {pesoNeto.toFixed(2)}
            </span>
            <span className="text-3xl text-slate-500 ml-2">kg</span>
          </div>

          <div className="flex items-center gap-3 mb-10">
            <div className={`w-4 h-4 rounded-full ${isEstable ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-xl font-medium text-slate-600">
              {isConnected 
                ? (isEstable ? 'Peso Estable' : 'Balanza en movimiento...') 
                : 'Balanza Desconectada'}
            </span>
          </div>

          <button
            onClick={handleRegistrarMuestra}
            disabled={!isEstable || !isConnected}
            className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all shadow-lg
              ${isEstable && isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Registrar Muestra
          </button>
        </div>

        {/* Muestras List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h3 className="text-lg font-bold text-slate-800">Muestras Registradas</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {muestras.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>No hay muestras en la pasada actual.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {muestras.map((muestra, index) => (
                  <li 
                    key={index}
                    className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-xl font-bold tabular-nums text-slate-800">
                          {muestra.peso_neto.toFixed(2)} kg
                        </span>
                        <div className="text-sm mt-1">
                          {muestra.estado_validacion === 'ok' 
                            ? <span className="text-green-600 font-medium">En Rango</span>
                            : <span className="text-red-500 font-medium">Fuera de Rango</span>
                          }
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSample(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      aria-label="Descartar muestra"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleCerrarPasada}
              disabled={muestras.length === 0}
              className={`w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-all
                ${muestras.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              <CheckCircle2 className="w-6 h-6" />
              Cerrar Pasada
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
