import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { ArrowLeft, Play, Plus } from 'lucide-react';

export const GestionPasadasPage: React.FC = () => {
  const { user, closeLineSession, activeLineaId } = useAuth();
  const navigate = useNavigate();

  if (!activeLineaId) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  const handleVolver = () => {
    closeLineSession();
    navigate('/tablet/seleccion-linea');
  };

  const handleAbrirWorkspace = () => {
    navigate('/tablet');
  };

  // Mock data
  const mockPasadas = [
    { id: 101, estado: 'En Progreso', articulo: 'Articulo A' },
    { id: 102, estado: 'Pausada', articulo: 'Articulo B' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
      <header className="bg-slate-800 border-b border-slate-700 p-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleVolver}
            className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
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
            onClick={handleAbrirWorkspace}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nueva Pasada
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPasadas.map((pasada) => (
            <div key={pasada.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
              <h3 className="text-lg font-bold">Pasada #{pasada.id}</h3>
              <p className="text-slate-400 mb-4">{pasada.articulo}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${pasada.estado === 'En Progreso' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
                  {pasada.estado}
                </span>
                <button
                  onClick={handleAbrirWorkspace}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Play size={16} />
                  Continuar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
