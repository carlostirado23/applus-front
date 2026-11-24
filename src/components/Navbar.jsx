import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const Navbar = ({ toggleSidebar }) => {
  // Al cerrar sesión, PrivateRoute redirige a /login.
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          className="lg:hidden text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Sistema Administrativo</h2>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/perfil"
          title="Mi perfil"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-700">{user?.nombre || 'Usuario'}</span>
        </Link>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors text-sm font-medium cursor-pointer"
        >
          <Icon name="logout" className="w-4 h-4" />
          Salir
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
