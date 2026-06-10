import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 5000,
});

let _logout: (() => void) | null = null;
export const setLogoutHandler = (fn: () => void) => {
  _logout = fn;
};

// Interceptor para agregar el token JWT a cada request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (_logout) {
        _logout();
      } else {
        // Fallback for before AuthProvider is mounted or if not used
        try {
          Cookies.remove('token');
          localStorage.removeItem('user');
        } catch { /* storage unavailable */ }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
