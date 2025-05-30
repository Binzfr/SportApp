// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import SeancesPage from './pages/SeancesPage';

function App() {
  const token = localStorage.getItem('authToken');

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* dashboard protégé */}
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      {/* séances protégé */}
      <Route
        path="/seances/*"
        element={token ? <SeancesPage /> : <Navigate to="/login" replace />}
      />

      {/* tout le reste */}
      <Route
        path="*"
        element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
