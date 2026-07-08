import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuth } from './features/auth/context/AuthContext';
import { ThemeToggle } from './features/theme/ThemeToggle';
import { TabletLayout } from './layouts/TabletLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { UsuarioRol } from './shared/types';
import { TabletWorkspace } from './features/tablet/pages/TabletWorkspace';
import { SeleccionLineaPage } from './features/tablet/pages/SeleccionLineaPage';
import { GestionPasadasPage } from './features/tablet/pages/GestionPasadasPage';
import { MuestrasLibresLayout } from './features/tablet/pages/MuestrasLibresLayout';
import { MuestrasLibresPage } from './features/tablet/pages/MuestrasLibresPage';

import { ArticulosPage } from './features/dashboard/pages/ArticulosPage';
import { UsuariosPage } from './features/dashboard/pages/UsuariosPage';
import { EtapasPage } from './features/dashboard/pages/EtapasPage';
import { LineasPage } from './features/dashboard/pages/LineasPage';
import { RutasPage } from './features/dashboard/pages/RutasPage';
import { RutaFormPage } from './features/dashboard/pages/RutaFormPage';
import { SesionesActivasPage } from './features/dashboard/pages/SesionesActivasPage';
import { DispositivosConectadosPage } from './features/dashboard/pages/DispositivosConectadosPage';

function App() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.rol === UsuarioRol.ADMINISTRADOR;
  const isJefe = user?.rol === UsuarioRol.JEFE || isAdmin;

  const getDefaultRoute = () => {
    if (!isAuthenticated) return "/login";
    return (user?.rol as string) === UsuarioRol.OPERARIO ? "/tablet/seleccion-linea" : "/dashboard";
  };

  // Dev-only theme toggle: never shown to real operators, reachable only via
  // the exact query param `?devTheme=1` (allow-list match, not truthy coercion).
  const showDevTheme = new URLSearchParams(window.location.search).get('devTheme') === '1';

  return (
    <Router>
      {showDevTheme && <ThemeToggle />}
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Tablet Layer 2 flow (before workspace) */}
        <Route path="/tablet/seleccion-linea" element={<SeleccionLineaPage />} />

        {/* Pasadas + free quality samples share a pathless layout so the Provider stays mounted across navigation */}
        <Route element={<MuestrasLibresLayout />}>
          <Route path="/tablet/pasadas" element={<GestionPasadasPage />} />
          <Route path="/tablet/muestras-libres" element={<MuestrasLibresPage />} />
        </Route>

        {/* Tablet workspace (after Layer 2 activated) */}
        <Route path="/tablet" element={<TabletLayout />}>
          <Route index element={<TabletWorkspace />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div className="bg-white p-6 rounded-lg shadow-sm text-gray-500">Monitoreo en vivo — en construcción</div>} />
          <Route path="planta" element={<Navigate to="/tablet/seleccion-linea" replace />} />
          <Route path="articulos" element={isJefe ? <ArticulosPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="etapas" element={isJefe ? <EtapasPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="lineas" element={isJefe ? <LineasPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="rutas" element={isJefe ? <RutasPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="rutas/new" element={isJefe ? <RutaFormPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="rutas/:id" element={isJefe ? <RutaFormPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="usuarios" element={isAdmin ? <UsuariosPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="sesiones-activas" element={isAdmin ? <SesionesActivasPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="dispositivos-conectados" element={isAdmin ? <DispositivosConectadosPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="reportes" element={<div className="bg-white p-6 rounded-lg shadow-sm text-gray-500">Reportes — en construcción</div>} />
        </Route>

        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
