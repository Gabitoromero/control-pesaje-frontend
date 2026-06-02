import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuth } from './features/auth/context/AuthContext';
import { TabletLayout } from './layouts/TabletLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { UsuarioRol } from './shared/types';
import { TabletWorkspace } from './features/tablet/pages/TabletWorkspace';

import { ArticulosPage } from './features/dashboard/pages/ArticulosPage';
import { UsuariosPage } from './features/dashboard/pages/UsuariosPage';

function App() {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return "/login";
    return (user?.rol as string) === UsuarioRol.OPERARIO ? "/tablet" : "/dashboard";
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Tablet Routes */}
        <Route path="/tablet" element={<TabletLayout />}>
          <Route index element={<TabletWorkspace />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div className="bg-white p-6 rounded shadow-sm text-gray-500">Monitoreo en vivo (En construcción)</div>} />
          <Route path="articulos" element={<ArticulosPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="reportes" element={<div className="bg-white p-6 rounded shadow-sm text-gray-500">Reportes (En construcción)</div>} />
        </Route>

        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
