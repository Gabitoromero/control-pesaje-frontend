import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/AuthContext';
import api from '../../../api/axios';
import { isAxiosError } from 'axios';
import { getApiErrorMessage } from '../../../utils/errors';
import { abrirSesionLinea } from '../../../api/auth';
import type { Linea } from '../../../api/lineas';
import { getAvatarInitials } from '../utils/avatarInitials';

export const SeleccionLineaPage: React.FC = () => {
  const { isAuthenticated, user, logout, openLineSession, activeLineaId } = useAuth();
  const navigate = useNavigate();
  const [activatingId, setActivatingId] = React.useState<number | null>(null);

  const { data: lineas = [], isLoading: loading, error, refetch } = useQuery<Linea[]>({
    queryKey: ['lineas-produccion'],
    queryFn: async () => {
      const response = await api.get('/lineas-produccion');
      if (response.data?.success) {
        const rawLineas = response.data.data as Linea[];
        return rawLineas.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));
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
      navigate('/tablet/pasadas', { replace: true, state: { lineaId: linea.id, lineaNombre: linea.nombre } });
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
    <div data-testid="tablet-page-root" className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 md:px-8 flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Seleccionar Línea de Producción
        </h1>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
              {getAvatarInitials(user?.nombreUsuario)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user?.nombreUsuario}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-lg"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main data-testid="tablet-page-scroll" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p>Cargando líneas de producción...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 text-destructive text-sm text-center">
            <p className="font-semibold mb-1 text-base">Error al cargar datos</p>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-destructive hover:bg-destructive/90 active:scale-95 rounded-xl transition-all text-xs font-semibold text-destructive-foreground"
            >
              Reintentar
            </button>
          </div>
        ) : lineas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay líneas de producción activas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 min-[720px]:grid-cols-2 min-[1080px]:grid-cols-3 gap-4">
              {lineas.map((linea) => (
                <button
                  key={linea.id}
                  onClick={() => handleSeleccionarLinea(linea)}
                  disabled={linea.estado === 'ocupada' || activatingId !== null}
                  className={`w-full flex items-start justify-between p-6 rounded-2xl border transition-all text-left
                    ${linea.estado === 'disponible'
                      ? 'bg-card border-border hover:border-primary active:scale-95 shadow-md'
                      : 'bg-card/50 border-border opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-xl text-foreground">{linea.nombre}</p>
                    {linea.rutaPasadaActiva?.nombre && (
                      <p className="text-sm text-primary mt-1">Ruta: {linea.rutaPasadaActiva.nombre}</p>
                    )}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-3
                        ${linea.estado === 'disponible' ? 'bg-success-muted text-success' : 'bg-warning-muted text-warning'}`}
                    >
                      {linea.estado === 'disponible' ? 'Disponible' : 'Ocupada'}
                    </span>
                  </div>
                  {linea.estado === 'disponible' && (
                    activatingId === linea.id ? (
                      <Loader2 size={24} className="text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
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
