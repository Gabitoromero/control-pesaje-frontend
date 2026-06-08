import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import api from '../../../api/axios';
import { User, Lock } from 'lucide-react';

type Step = 'legajo' | 'pin';

interface LocationState {
  lineaId: number;
  lineaNombre?: string;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function ActivarSesionPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lineaId, lineaNombre } = (location.state ?? {}) as LocationState;

  const [step, setStep] = useState<Step>('legajo');
  const [legajo, setLegajo] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  const isLegajoStep = step === 'legajo';

  const handleDigit = (digit: string) => {
    if (!isLegajoStep && pin.length >= 6) return;
    if (isLegajoStep) {
      setLegajo(prev => prev + digit);
    } else {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (isLegajoStep) {
      setLegajo(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleActivar = async () => {
    try {
      await api.post('/auth/activar-sesion', { lineaProduccionId: lineaId, legajo, pin });
      navigate('/tablet', { state: { lineaId, legajo } });
    } catch {
      setError('PIN o legajo incorrecto');
    }
  };

  const keypad = (
    <div className="grid grid-cols-3 gap-3">
      {DIGITS.map(d => (
        <button
          key={d}
          onClick={() => handleDigit(d)}
          className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-2xl font-bold transition-all"
        >
          {d}
        </button>
      ))}
      <button
        onClick={handleBackspace}
        className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-2xl font-bold transition-all"
      >
        ⌫
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-sm space-y-6">

        {/* Stepper UI */}
        <div className="flex items-center justify-center" data-testid="stepper-ui">
          <div
            data-testid="stepper-step-legajo"
            className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-500/20 text-blue-400 transition-all duration-300"
          >
            <User size={24} />
          </div>
          <div
            data-testid="stepper-line"
            className={`w-16 h-1 transition-colors duration-300 ${
              isLegajoStep ? 'bg-slate-700' : 'bg-blue-500'
            }`}
          />
          <div
            data-testid="stepper-step-pin"
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              isLegajoStep
                ? 'border-slate-700 bg-slate-800 text-slate-500'
                : 'border-blue-500 bg-blue-500/20 text-blue-400'
            }`}
          >
            <Lock size={24} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-200">{lineaNombre}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isLegajoStep ? 'Ingresá tu legajo' : 'Ingresá tu PIN'}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-center text-3xl font-mono tracking-widest min-h-16 flex items-center justify-center">
          {isLegajoStep ? legajo : pin}
        </div>

        {keypad}

        {isLegajoStep ? (
          <button
            onClick={() => setStep('pin')}
            disabled={!legajo}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold transition-all"
          >
            Continuar
          </button>
        ) : (
          <div className="space-y-3">
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              onClick={handleActivar}
              disabled={pin.length < 4}
              className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold transition-all"
            >
              Activar sesión
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
