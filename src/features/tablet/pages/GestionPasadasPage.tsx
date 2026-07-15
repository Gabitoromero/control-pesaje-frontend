import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Plus, Loader2, X, AlertTriangle, FlaskConical } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { getPasadas, iniciarPasada } from '../../../api/pasadas';
import { getLinea } from '../../../api/lineas';
import { getArticulosPorRuta } from '../../../api/rutas-pasadas-articulos';
import type { Pasada } from '../../../shared/types/domain';
import type { Articulo } from '../../../api/articulos';
import { PasadaCard } from '../components/PasadaCard';

export const GestionPasadasPage: React.FC = () => {
  const { user, closeLineSession, activeLineaId, logout } = useAuth();
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
    // Poll every 5 s so aborted/completed runs disappear without a page reload
    refetchInterval: 5000,
  });

  // Query the active line to verify it has a route assigned
  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

  const sinRutaAsignada = linea !== undefined && !linea.rutaPasadaActiva;
  const etapasRuta = linea?.rutaPasadaActiva?.etapas ?? [];

  // Query articles for the "Nueva Pasada" modal
  const rutaPasadaId = linea?.rutaPasadaActiva?.id;
  const {
    data: articulos = [],
    isLoading: loadingArticulos,
    error: errorArticulos
  } = useQuery<Articulo[]>({
    queryKey: ['articulos-ruta', rutaPasadaId],
    queryFn: () => getArticulosPorRuta(rutaPasadaId!),
    enabled: isModalOpen && !!rutaPasadaId,
  });

  if (!activeLineaId) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  // Task 2.2: Client-side filtering by user.id.
  // The backend may return usuarioId as a flat field, usuario as a number, or nested inside usuario.id.
  const filteredPasadas = pasadas.filter((pasada: Pasada) => {
    const byFlatId = pasada.usuarioId === user?.id;
    const byUsuarioNumber = typeof pasada.usuario === 'number' && pasada.usuario === user?.id;
    const byUsuarioObject = typeof pasada.usuario === 'object' && pasada.usuario !== null && pasada.usuario.id === user?.id;
    return byFlatId || byUsuarioNumber || byUsuarioObject;
  });

  const handleLogout = () => {
    if (user?.rol === 'jefe' || user?.rol === 'administrador') {
      navigate('/dashboard');
      closeLineSession();
    } else {
      closeLineSession().finally(() => {
        logout();
      });
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground relative">
      <header className="bg-card border-b border-border p-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gestión de Pasadas</h1>
            <p className="text-muted-foreground text-sm">Línea {activeLineaId} - {user?.nombreUsuario}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium bg-muted/50 hover:bg-muted px-4 py-2 rounded-lg"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {/* Warning: line has no route assigned */}
        {sinRutaAsignada && (
          <div className="flex items-start gap-3 bg-warning/10 border border-warning/50 rounded-2xl p-5 mb-6">
            <AlertTriangle size={20} className="text-warning mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-warning text-sm">Sin ruta de pesaje asignada</p>
              <p className="text-warning/80 text-sm mt-1">
                Esta línea de producción no tiene una ruta activa configurada.
                No es posible iniciar nuevas pasadas hasta que un administrador asigne una ruta.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 min-[840px]:grid-cols-[1fr_416px] gap-6 items-start">
          <section>
            <h2 className="text-xl font-semibold mb-6">Pasadas Activas</h2>

            {loadingPasadas ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin text-primary" size={36} />
                <p className="text-sm font-medium">Cargando pasadas activas...</p>
              </div>
            ) : errorPasadas ? (
              <div className="bg-destructive/10 border border-destructive/50 rounded-2xl p-6 text-center max-w-xl mx-auto">
                <p className="font-semibold text-destructive mb-2">Error al cargar las pasadas</p>
                <button
                  onClick={() => refetchPasadas()}
                  className="px-4 py-2 bg-destructive hover:opacity-90 rounded-lg text-xs font-semibold text-destructive-foreground transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredPasadas.length === 0 ? (
              <div className="bg-card/40 border border-border/40 rounded-2xl p-12 text-center text-muted-foreground">
                <p className="text-lg font-medium mb-1">No hay pasadas en curso para tu usuario</p>
                <p className="text-sm text-muted-foreground mb-6">Inicia una nueva pasada utilizando el botón.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 min-[840px]:grid-cols-1 min-[950px]:grid-cols-2 gap-4">
                {filteredPasadas.map((pasada) => (
                  <PasadaCard key={pasada.id} pasada={pasada} etapas={etapasRuta} />
                ))}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={sinRutaAsignada}
              className={`flex items-center justify-center gap-2 h-16 rounded-2xl text-lg font-bold transition-all shadow-lg ${
                sinRutaAsignada
                  ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                  : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              <Plus size={22} />
              Nueva Pasada
            </button>

            {/* Free quality samples CTA — visible only for authorized users with an active route */}
            {user?.puedeTomarMuestrasLibres && !sinRutaAsignada && linea?.rutaPasadaActiva && (
              <section
                data-testid="muestras-libres-section"
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical size={20} className="text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">Muestras de Calidad Libre</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Control de calidad sin asociar a una pasada
                </p>
                <button
                  onClick={() => navigate('/tablet/muestras-libres')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-warning/10 border border-warning text-warning rounded-lg text-sm font-medium transition-all hover:bg-warning/20"
                >
                  Tomar Muestras Libres
                </button>
              </section>
            )}
          </aside>
        </div>
      </main>

      {/* Modern Glassmorphic Article Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Iniciar Nueva Pasada</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedArticuloId(null);
                  setErrorIniciar(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {errorIniciar && (
                <div className="mb-4 bg-destructive/10 border border-destructive/50 rounded-xl p-3.5 text-sm text-destructive">
                  {errorIniciar}
                </div>
              )}

              <p className="text-muted-foreground text-sm mb-4">Seleccione el artículo a pesar en esta pasada:</p>

              {loadingArticulos ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <p className="text-xs">Cargando artículos...</p>
                </div>
              ) : errorArticulos ? (
                <p className="text-sm text-destructive text-center py-4">Error al cargar los artículos.</p>
              ) : articulos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay artículos asignados a esta ruta</p>
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
                            ? 'bg-primary/25 border-primary text-primary-foreground shadow-md shadow-primary/5'
                            : 'bg-muted border-border hover:bg-muted/70 text-foreground'
                          }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {articulo.nombre}
                          </p>
                          {articulo.marca && (
                            <p className="text-xs text-muted-foreground mt-0.5">{articulo.marca}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedArticuloId(null);
                  setErrorIniciar(null);
                }}
                className="px-4.5 py-2.5 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-sm font-semibold transition-colors"
                disabled={iniciando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleIniciarPasada}
                disabled={!selectedArticuloId || iniciando}
                className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
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
