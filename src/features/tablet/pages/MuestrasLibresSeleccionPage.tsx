import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

export function MuestrasLibresSeleccionPage() {
  const { etapas } = useOutletContext<{ etapas: RutaPasadaEtapa[] }>();
  const { setSelectedEtapaId } = useMuestrasLibresContext();
  const navigate = useNavigate();

  const handleSelectEtapa = (etapaId: number) => {
    setSelectedEtapaId(etapaId);
    navigate('/tablet/muestras-libres/registro');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Seleccionar Etapa</h1>
        <button
          onClick={() => navigate('/tablet/pasadas')}
          className="px-4 py-2 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          Volver
        </button>
      </div>

      {etapas.length === 0 ? (
        <p className="text-slate-400 text-center mt-8">No hay etapas configuradas</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {etapas.map((rutaEtapa) => (
            <li key={rutaEtapa.etapa.id}>
              <button
                onClick={() => handleSelectEtapa(rutaEtapa.etapa.id)}
                className="w-full text-left px-6 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xl font-semibold transition-colors border border-slate-700 active:scale-95"
              >
                {rutaEtapa.etapa.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
