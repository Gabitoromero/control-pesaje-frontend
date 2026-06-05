import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../features/auth/context/AuthContext';
import { getApiErrorMessage } from '../utils/errors';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresá usuario/legajo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        nombreUsuario: username,
        contrasena: password,
      });

      const { token } = response.data.data as { token: string };
      // JWT payload is base64url-encoded — decode it to get user claims
      const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const user = JSON.parse(atob(payloadB64));

      login({ token, user });

      if (user.rol === 'operario') {
        navigate('/tablet/seleccion-linea');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Control de Pesaje</h1>
          <p className="text-slate-400">Acceso al Dashboard de Supervisión</p>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <User size={20} />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600 text-lg"
                placeholder="Usuario o Legajo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <KeyRound size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="block w-full pl-12 pr-12 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600 text-lg"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-medium animate-pulse">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl transition-colors shadow-lg shadow-blue-900/20 text-lg font-semibold"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <CheckCircle2 size={24} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
