import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Lock, Sun, Moon } from 'lucide-react';
import { isAxiosError } from 'axios';
import { loginApi } from '../api/auth';
import { useAuth } from '../features/auth/context/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();

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
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('PIN o legajo incorrecto');
      }
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
          className="h-12 rounded-2xl bg-secondary hover:bg-muted active:scale-95 text-2xl font-bold text-foreground transition-all disabled:opacity-50"
        >
          {d}
        </button>
      ))}
      <button
        onClick={handleBackspace}
        disabled={loading}
        className="h-12 rounded-2xl bg-secondary hover:bg-muted active:scale-95 text-2xl font-bold text-muted-foreground transition-all disabled:opacity-50"
      >
        ⌫
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col md:flex-row font-sans text-foreground relative">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card/80 backdrop-blur text-foreground shadow-sm hover:bg-secondary transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      {/* Branding Side — theme-aware like the rest of the page. Hidden on mobile. */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-card flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-background/60 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-brand-hover" />

        <div className="z-10 text-center max-w-lg">
          {/* The system's own name "settles onto the scale": the scale
              assembles itself (base, pedestal, plate) as the icon drops in
              with a spring bounce; the plate squashes right as the icon
              lands, like it just received the weight, then recovers. */}
          <motion.div
            className="mb-8"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.1 }}
          >
            <motion.div
              className="w-24 h-24 bg-brand rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-black/30"
              initial={{ rotate: -8 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 7, delay: 0.5 }}
            >
              <img src="/android-chrome-192x192.png" alt="Controlador de Pesaje" className="w-12 h-12 object-contain rounded-xl" />
            </motion.div>
            <svg viewBox="0 0 160 50" className="w-32 h-10 mx-auto mt-2" aria-hidden="true">
              <motion.rect
                x="45" y="34" width="70" height="8" rx="3"
                className="fill-brand/25"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              />
              <motion.rect
                x="65" y="18" width="30" height="18" rx="2"
                className="fill-brand/25"
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.45, duration: 0.25 }}
              />
              <motion.rect
                x="10" y="10" width="140" height="10" rx="4"
                className="fill-brand/40"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ opacity: 0, scaleY: 0.4 }}
                animate={{ opacity: 1, scaleY: [0.4, 1, 0.75, 1] }}
                transition={{ delay: 0.55, duration: 0.45, times: [0, 0.35, 0.7, 1] }}
              />
            </svg>
          </motion.div>
          <motion.h1
            className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-foreground"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            Controlador de Pesaje
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-lg lg:text-xl leading-relaxed"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            Plataforma integral para gestión y monitoreo de líneas de producción en tiempo real.
          </motion.p>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center p-3 sm:p-6 h-full bg-background overflow-hidden">
        <div className="w-full max-w-sm space-y-3">

          {/* Header UI - Only visible on mobile since branding side handles desktop */}
          <div className="text-center mb-4 md:hidden">
            <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-brand/20">
              <img src="/android-chrome-192x192.png" alt="Controlador de Pesaje" className="w-8 h-8 object-contain rounded-lg" />
            </div>
            <h1 className="text-xl font-bold mb-1">Controlador de Pesaje</h1>
            <p className="text-muted-foreground">Ingreso al sistema</p>
          </div>

          {/* Stepper UI */}
        <div className="flex items-center justify-center" data-testid="stepper-ui">
          <div
            data-testid="stepper-step-legajo"
            onClick={() => { if (!loading) setStep('legajo'); }}
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${
              isLegajoStep
                ? 'border-brand bg-brand-muted text-brand'
                : 'border-border bg-secondary text-muted-foreground'
            }`}
          >
            <User size={24} />
          </div>
          <div
            data-testid="stepper-line"
            className={`w-16 h-1 transition-colors duration-300 ${
              isLegajoStep ? 'bg-secondary' : 'bg-brand'
            }`}
          />
          <div
            data-testid="stepper-step-pin"
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              isLegajoStep
                ? 'border-border bg-secondary text-muted-foreground'
                : 'border-brand bg-brand-muted text-brand'
            }`}
          >
            <Lock size={24} />
          </div>
        </div>

        <div className="text-center h-6">
          <p className="text-sm text-muted-foreground">
            {isLegajoStep ? 'Ingresá tu legajo' : 'Ingresá tu PIN'}
          </p>
        </div>

        <form onSubmit={e => {
          e.preventDefault();
          if (isLegajoStep && legajo) setStep('pin');
          else if (!isLegajoStep && pin.length >= 4) handleLogin();
        }}>
          <div className="bg-card border border-border rounded-2xl px-6 py-2 text-center text-3xl font-mono tracking-widest min-h-12 flex items-center justify-center">
            {isLegajoStep ? (
              <input
                type="text"
                aria-label="Usuario o Legajo"
                className="bg-transparent text-center w-full outline-none text-foreground placeholder-muted-foreground"
                value={legajo}
                onChange={e => setLegajo(e.target.value)}
              />
            ) : (
              <input
                type="password"
                aria-label="Contraseña"
                className="bg-transparent text-center w-full outline-none tracking-widest text-foreground placeholder-muted-foreground"
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
          <p className="text-destructive text-sm text-center animate-pulse mt-2">{error}</p>
        )}

        {keypad}

        {isLegajoStep ? (
          <button
            onClick={() => setStep('pin')}
            disabled={!legajo || loading}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold text-primary-foreground transition-all mt-2"
          >
            Continuar
          </button>
        ) : (
          <div className="space-y-3 mt-2">
            <button
              onClick={handleLogin}
              disabled={pin.length < 4 || loading}
              className="w-full h-12 rounded-2xl bg-brand-light hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Ingresar
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Login;
