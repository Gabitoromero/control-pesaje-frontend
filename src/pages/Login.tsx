import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete, Lock, User, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNumberClick = (num: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !pin) {
      setError('Por favor, ingresá usuario y PIN');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        nombreUsuario: username,
        contrasena: pin,
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
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
          <p className="text-slate-400">Ingresá tus credenciales para comenzar</p>
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
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 border-slate-600 ${
                      pin.length > i ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-transparent'
                    } transition-all duration-200`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center font-medium animate-pulse">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'borrar', 0, 'ok'].map((btn) => {
                  if (btn === 'borrar') {
                    return (
                      <button
                        key="del"
                        type="button"
                        onClick={handleDelete}
                        className="h-16 flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 rounded-2xl transition-colors active:scale-95"
                      >
                        <Delete size={24} className="text-slate-300" />
                      </button>
                    );
                  }
                  if (btn === 'ok') {
                    return (
                      <button
                        key="ok"
                        type="submit"
                        disabled={loading}
                        className="h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl transition-colors active:scale-95 shadow-lg shadow-blue-900/20"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={24} />
                        )}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleNumberClick(btn.toString())}
                      className="h-16 flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 text-2xl font-semibold rounded-2xl transition-colors active:scale-95"
                    >
                      {btn}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
