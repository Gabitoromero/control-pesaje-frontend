import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { MuestrasListPanel } from '../components/MuestrasListPanel';

export function MuestrasLibresRegistroPage() {
  const { activeLineaId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { pesoNeto, isConnected } = useBalanzaWebSocket(activeLineaId);
  const { muestras, etapas, addSample, removeSample, isRegistering, setSelectedEtapaId } =
    useMuestrasLibresContext();

  // Sync etapaId from URL param on mount
  useEffect(() => {
    const etapaIdParam = searchParams.get('etapaId');
    if (etapaIdParam) {
      setSelectedEtapaId(Number(etapaIdParam));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegistrar = async () => {
    await addSample(pesoNeto);
  };

  const handleFinalizar = () => {
    navigate('/tablet/pasadas');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 gap-6">
      {/* Main two-column area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: scale + register */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 flex flex-col items-center justify-center gap-6">
          <Scale className={`w-20 h-20 ${isConnected ? 'text-blue-400' : 'text-slate-500'}`} />

          <div className="text-center">
            <span className="text-7xl font-black text-white tabular-nums">{pesoNeto.toFixed(3)}</span>
            <span className="text-2xl text-slate-400 ml-2">kg</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'Conectado' : 'Sin señal'}
            </span>
          </div>

          <button
            onClick={handleRegistrar}
            disabled={!isConnected || isRegistering}
            className={`w-full py-5 rounded-2xl text-xl font-bold transition-all
              ${!isConnected || isRegistering
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-lg'
              }`}
          >
            Registrar muestra
          </button>
        </div>

        {/* Right: sample list */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">Muestras Registradas</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <MuestrasListPanel muestras={muestras} onRemoveSample={removeSample} etapas={etapas} />
          </div>
        </div>
      </div>

      {/* Bottom: always-visible Finalizar button */}
      <button
        onClick={handleFinalizar}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xl font-bold transition-all active:scale-95 shadow-lg"
      >
        Finalizar
      </button>
    </div>
  );
}
