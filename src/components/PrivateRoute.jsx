import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Exige sesión. Con `roles` también exige uno de esos roles (si no, manda al dashboard). */
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default PrivateRoute;
