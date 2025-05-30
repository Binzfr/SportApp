// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SeancesPage from './pages/SeancesPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  const token = localStorage.getItem('authToken'); // ou contexte

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/seances/*"
        element={token ? <SeancesPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={token ? '/seances' : '/login'} replace />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;
