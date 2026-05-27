import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard (En construcción)</h1>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
