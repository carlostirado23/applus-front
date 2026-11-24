import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Precargar from './pages/Precargar';
import Historico from './pages/Historico';
import Resultados from './pages/Resultados';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/precargar" element={<Precargar />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route
              path="/usuarios"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <Usuarios />
                </PrivateRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
