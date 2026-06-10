import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { loginApi } from '../api/auth';
import { useAuth } from '../features/auth/context/AuthContext';

type Step = 'legajo' | 'pin';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const Login: React.FC = () => {
  const [step, setStep] = useState<Step>('legajo');
  const [legajo, setLegajo] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!legajo || !pin) return;
    
    setLoading(true);
    setError(null);
    try {
      const { token } = await loginApi({ legajo, pin });
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.id,
        legajo: payload.legajo,
        nombreUsuario: payload.nombreUsuario,
        rol: payload.rol,
        puedeTomarMuestrasLibres: payload.puedeTomarMuestrasLibres,
      };

      login({ token, user });

      if (user.rol === 'operario') {
        navigate('/tablet/seleccion-linea');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('PIN o legajo incorrecto');
      setStep('legajo');
      setPin('');
    } finally {
      setLoading(false);
    }
  };




  const keypad = (
    <div className="grid grid-cols-3 gap-3">
      {DIGITS.map(d => (
        <button
          key={d}
          onClick={() => handleDigit(d)}
          disabled={loading}
          className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-2xl font-bold transition-all disabled:opacity-50"
        >
          {d}
        </button>
      ))}
      <button
        onClick={handleBackspace}
        disabled={loading}
        className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-2xl font-bold transition-all disabled:opacity-50"
      >
        ⌫
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-sm space-y-6">

        {/* Header UI */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1">Control de Pesaje</h1>
          <p className="text-slate-400">Ingreso al sistema</p>
        </div>

        {/* Stepper UI */}
        <div className="flex items-center justify-center" data-testid="stepper-ui">
          <div
            data-testid="stepper-step-legajo"
            onClick={() => { if (!loading) setStep('legajo'); }}
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-pointer ${
              isLegajoStep 
                ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                : 'border-slate-600 bg-slate-700 text-slate-300'
            }`}
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

        <div className="text-center h-8">
          <p className="text-sm text-slate-400">
            {isLegajoStep ? 'Ingresá tu legajo' : 'Ingresá tu PIN'}
          </p>
        </div>

        <form onSubmit={e => {
          e.preventDefault();
          if (isLegajoStep && legajo) setStep('pin');
          else if (!isLegajoStep && pin.length >= 4) handleLogin();
        }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-center text-3xl font-mono tracking-widest min-h-16 flex items-center justify-center">
            {isLegajoStep ? (
              <input
                autoFocus
                type="text"
                aria-label="Usuario o Legajo"
                className="bg-transparent text-center w-full outline-none placeholder-slate-600"
                value={legajo}
                onChange={e => setLegajo(e.target.value)}
              />
            ) : (
              <input
                autoFocus
                type="password"
                aria-label="Contraseña"
                className="bg-transparent text-center w-full outline-none tracking-widest placeholder-slate-600"
                value={pin}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setPin(val);
                }}
              />
            )}
          </div>
        </form>

        {error && (
          <p className="text-red-400 text-sm text-center animate-pulse mt-2">{error}</p>
        )}

        {keypad}

        {isLegajoStep ? (
          <button
            onClick={() => setStep('pin')}
            disabled={!legajo || loading}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold transition-all mt-4"
          >
            Continuar
          </button>
        ) : (
          <div className="space-y-3 mt-4">
            <button
              onClick={handleLogin}
              disabled={pin.length < 4 || loading}
              className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Ingresar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
