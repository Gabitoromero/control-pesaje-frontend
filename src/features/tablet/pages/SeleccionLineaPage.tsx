import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Factory, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import api from '../../../api/axios';
import { isAxiosError } from 'axios';
import { getApiErrorMessage } from '../../../utils/errors';
import { abrirSesionLinea } from '../../../api/auth';
import type { Linea } from '../../../api/lineas';

export const SeleccionLineaPage: React.FC = () => {
  const { isAuthenticated, user, logout, openLineSession } = useAuth();
  const navigate = useNavigate();
  const [activatingId, setActivatingId] = React.useState<number | null>(null);

  const { data: lineas = [], isLoading: loading, error, refetch } = useQuery<Linea[]>({
    queryKey: ['lineas-produccion'],
    queryFn: async () => {
      const response = await api.get('/lineas-produccion');
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error('No se pudo obtener la lista de líneas');
    },
    enabled: isAuthenticated,
  });

  const errorMessage = error ? getApiErrorMessage(error, 'Error al cargar las líneas') : null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleSeleccionarLinea = async (linea: Linea) => {
    if (linea.id === undefined) return;
    if (linea.estado === 'ocupada') return;
    try {
      setActivatingId(linea.id);
      await abrirSesionLinea(linea.id);
      openLineSession(linea.id);
      navigate('/tablet/pasadas', { state: { lineaId: linea.id, lineaNombre: linea.nombre } });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        toast.error(err.response.data?.error?.message || 'Línea ocupada');
      } else {
        toast.error('Error al activar la línea');
      }
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Selección de Línea</h1>
            <p className="text-slate-400 text-sm">{user?.nombreUsuario}</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (user?.rol === 'jefe' || user?.rol === 'administrador') {
              navigate('/dashboard');
            } else {
              logout();
            }
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium bg-slate-700/50 hover:bg-slate-700 px-4 py-2 rounded-lg"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p>Cargando líneas de producción...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-5 text-red-300 text-sm text-center">
            <p className="font-semibold mb-1 text-base">Error al cargar datos</p>
            <p className="text-slate-300 mb-4">{errorMessage}</p>
            <button 
              onClick={() => refetch()}
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {lineas.map((linea) => (
                <button
                  key={linea.id}
                  onClick={() => handleSeleccionarLinea(linea)}
                  disabled={linea.estado === 'ocupada' || activatingId !== null}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all
                    ${linea.estado === 'disponible'
                      ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750 active:scale-95 shadow-md hover:shadow-blue-900/20'
                      : 'bg-slate-800/50 border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-xl">{linea.nombre}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${linea.estado === 'disponible' ? 'bg-green-400' : 'bg-amber-400'}`} />
                      <p className={`text-sm font-medium ${linea.estado === 'disponible' ? 'text-green-400' : 'text-amber-400'}`}>
                        {linea.estado === 'disponible' ? 'Disponible' : 'Ocupada'}
                      </p>
                    </div>
                  </div>
                  {linea.estado === 'disponible' && (
                    activatingId === linea.id ? (
                      <Loader2 size={24} className="text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ArrowRight size={20} />
                      </div>
                    )
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
