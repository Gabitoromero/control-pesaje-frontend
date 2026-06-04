import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Factory, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import api from '../../../api/axios';
import { getApiErrorMessage } from '../../../utils/errors';

interface Linea {
  id: number;
  nombre: string;
  estado: 'disponible' | 'ocupada';
}

export const SeleccionLineaPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLineas = async () => {
    try {
      setError(null);
      const response = await api.get('/lineas-produccion');
      if (response.data?.success) {
        setLineas(response.data.data);
      } else {
        setError('No se pudo obtener la lista de líneas');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al cargar las líneas'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLineas();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-lg">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Factory size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Selección de Línea</h1>
              <p className="text-slate-400 text-sm">{user?.nombreUsuario}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>

        {/* Info box */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-2xl p-4 mb-6 text-blue-300 text-sm">
          <p className="font-semibold mb-1">Capa 2 — Paso 1: Selección de Línea</p>
          <p>
            El operario elige en qué línea de producción va a trabajar.
            La lista se carga en tiempo real desde el backend, mostrando el estado ocupado/disponible.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p>Cargando líneas de producción...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-5 text-red-300 text-sm text-center">
            <p className="font-semibold mb-1 text-base">Error al cargar datos</p>
            <p className="text-slate-300 mb-4">{error}</p>
            <button 
              onClick={() => { setLoading(true); fetchLineas(); }}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-600 active:scale-95 rounded-xl transition-all text-xs font-semibold text-white"
            >
              Reintentar
            </button>
          </div>
        ) : lineas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No hay líneas de producción activas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lineas.map((linea) => (
              <button
                key={linea.id}
                onClick={() => navigate('/tablet/activar-sesion', { state: { lineaId: linea.id, lineaNombre: linea.nombre } })}
                disabled={linea.estado === 'ocupada'}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all
                  ${linea.estado === 'disponible'
                    ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750 active:scale-99'
                    : 'bg-slate-800/50 border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-lg">{linea.nombre}</p>
                  <p className={`text-sm capitalize mt-0.5 ${linea.estado === 'disponible' ? 'text-green-400' : 'text-amber-400'}`}>
                    {linea.estado}
                  </p>
                </div>
                {linea.estado === 'disponible' && (
                  <ArrowRight size={20} className="text-slate-400" />
                )}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
