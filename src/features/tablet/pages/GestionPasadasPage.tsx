import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Plus, Loader2, X } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { getPasadas, iniciarPasada } from '../../../api/pasadas';
import { getArticulos } from '../../../api/articulos';
import type { Pasada } from '../../../shared/types/domain';
import type { Articulo } from '../../../api/articulos';

export const GestionPasadasPage: React.FC = () => {
  const { user, closeLineSession, activeLineaId } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedArticuloId, setSelectedArticuloId] = React.useState<number | null>(null);
  const [iniciando, setIniciando] = React.useState(false);
  const [errorIniciar, setErrorIniciar] = React.useState<string | null>(null);

  // Task 2.1: Query live active runs using React Query
  const { 
    data: pasadas = [], 
    isLoading: loadingPasadas, 
    error: errorPasadas,
    refetch: refetchPasadas 
  } = useQuery<Pasada[]>({
    queryKey: ['pasadas-activas', activeLineaId],
    queryFn: () => getPasadas({ lineaProduccionId: activeLineaId ?? undefined, estado: 'en_curso' }),
    enabled: !!activeLineaId,
  });

  // Query articles for the "Nueva Pasada" modal
  const { 
    data: articulos = [], 
    isLoading: loadingArticulos,
    error: errorArticulos
  } = useQuery<Articulo[]>({
    queryKey: ['articulos-activos'],
    queryFn: getArticulos,
    enabled: isModalOpen,
  });

  if (!activeLineaId) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  // Task 2.2: Client-side filtering by user.id
  const filteredPasadas = pasadas.filter((pasada: Pasada) => {
    const pasadaUsuarioId = pasada.usuarioId || pasada.usuario_id || (pasada.usuario && typeof pasada.usuario === 'object' ? pasada.usuario.id : pasada.usuario);
    return pasadaUsuarioId === user?.id;
  });

  const handleVolver = async () => {
    await closeLineSession();
    navigate('/tablet/seleccion-linea');
  };

  // Task 2.4: Redirect on selecting / continuing an active run
  const handleContinuarPasada = (pasadaId: number) => {
    navigate(`/tablet?pasadaId=${pasadaId}`);
  };

  // Task 2.3: Iniciar nueva pasada
  const handleIniciarPasada = async () => {
    if (!activeLineaId || !selectedArticuloId) return;
    try {
      setIniciando(true);
      setErrorIniciar(null);
      const newPasada = await iniciarPasada({
        lineaProduccionId: activeLineaId,
        articuloId: selectedArticuloId,
      });
      setIsModalOpen(false);
      setSelectedArticuloId(null);
      navigate(`/tablet?pasadaId=${newPasada.id}`);
    } catch (err: unknown) {
      console.error('Error starting pasada:', err);
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorIniciar(axiosErr.response?.data?.error?.message || axiosErr.message || 'Error al iniciar la pasada');
    } finally {
      setIniciando(false);
    }
  };

  // Helper to resolve article display name
  const getArticuloNombre = (pasada: Pasada) => {
    if (pasada.articulo && typeof pasada.articulo === 'object') {
      const brand = pasada.articulo.marca ? `${pasada.articulo.marca} - ` : '';
      return `${brand}${pasada.articulo.nombre}`;
    }
    const artId = pasada.articuloId || pasada.articulo_id || (typeof pasada.articulo === 'number' ? pasada.articulo : undefined);
    if (artId !== undefined) {
      const found = articulos.find(a => a.id === artId);
      if (found) {
        const brand = found.marca ? `${found.marca} - ` : '';
        return `${brand}${found.nombre}`;
      }
    }
    return `Artículo #${artId || '?'}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white relative">
      <header className="bg-slate-800 border-b border-slate-700 p-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleVolver}
            className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gestión de Pasadas</h1>
            <p className="text-slate-400 text-sm">Línea {activeLineaId} - {user?.nombreUsuario}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Pasadas Activas</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/25"
          >
            <Plus size={20} />
            Nueva Pasada
          </button>
        </div>

        {loadingPasadas ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={36} />
            <p className="text-sm font-medium">Cargando pasadas activas...</p>
          </div>
        ) : errorPasadas ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center max-w-xl mx-auto">
            <p className="font-semibold text-red-300 mb-2">Error al cargar las pasadas</p>
            <button 
              onClick={() => refetchPasadas()}
              className="px-4 py-2 bg-red-700 hover:bg-red-655 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredPasadas.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-12 text-center text-slate-400">
            <p className="text-lg font-medium mb-1">No hay pasadas en curso para tu usuario</p>
            <p className="text-sm text-slate-500 mb-6">Inicia una nueva pasada utilizando el botón superior.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPasadas.map((pasada) => (
              <div key={pasada.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-slate-600 transition-all hover:shadow-lg shadow-black/10">
                <h3 className="text-lg font-bold text-slate-200">Pasada #{pasada.id}</h3>
                <p className="text-slate-400 mb-6">{getArticuloNombre(pasada)}</p>
                <div className="mt-auto flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-950/70 border border-green-800/50 text-green-400">
                    En Progreso
                  </span>
                  <button
                    onClick={() => handleContinuarPasada(pasada.id)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Play size={16} />
                    Continuar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modern Glassmorphic Article Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Iniciar Nueva Pasada</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedArticuloId(null);
                  setErrorIniciar(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {errorIniciar && (
                <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-xl p-3.5 text-sm text-red-300">
                  {errorIniciar}
                </div>
              )}

              <p className="text-slate-400 text-sm mb-4">Seleccione el artículo a pesar en esta pasada:</p>

              {loadingArticulos ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <p className="text-xs">Cargando artículos...</p>
                </div>
              ) : errorArticulos ? (
                <p className="text-sm text-red-400 text-center py-4">Error al cargar los artículos.</p>
              ) : articulos.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay artículos activos disponibles.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto pr-1 space-y-2 select-none scrollbar-thin">
                  {articulos.map((articulo) => {
                    const isSelected = selectedArticuloId === articulo.id;
                    return (
                      <button
                        key={articulo.id}
                        onClick={() => setSelectedArticuloId(articulo.id ?? null)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between
                          ${isSelected 
                            ? 'bg-blue-600/25 border-blue-500 text-blue-100 shadow-md shadow-blue-500/5' 
                            : 'bg-slate-700 border-slate-650 hover:bg-slate-650 hover:border-slate-600 text-slate-300'
                          }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {articulo.nombre}
                          </p>
                          {articulo.marca && (
                            <p className="text-xs text-slate-400 mt-0.5">{articulo.marca}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-700 bg-slate-850">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedArticuloId(null);
                  setErrorIniciar(null);
                }}
                className="px-4.5 py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                disabled={iniciando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleIniciarPasada}
                disabled={!selectedArticuloId || iniciando}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {iniciando && <Loader2 size={16} className="animate-spin" />}
                Iniciar Pasada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
