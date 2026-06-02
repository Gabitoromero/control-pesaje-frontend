import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuth } from './features/auth/context/AuthContext';
import { TabletLayout } from './layouts/TabletLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { UsuarioRol } from './shared/types';

function App() {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return "/login";
    return user?.rol === UsuarioRol.OPERARIO ? "/tablet" : "/dashboard";
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Tablet Routes */}
        <Route path="/tablet" element={<TabletLayout />}>
          <Route index element={<div className="p-4 flex h-full items-center justify-center text-gray-500">Workspace de la Tablet (En construcción)</div>} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div className="bg-white p-6 rounded shadow-sm text-gray-500">Monitoreo en vivo (En construcción)</div>} />
          <Route path="reportes" element={<div className="bg-white p-6 rounded shadow-sm text-gray-500">Reportes (En construcción)</div>} />
        </Route>

        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
