import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500';

const iconClass = 'pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400';

const Login = () => {
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.usuario || !formData.password) {
      setError('Por favor, complete todos los campos');
      setLoading(false);
      return;
    }

    const result = await login(formData.usuario, formData.password);

    // Si fue exitoso, `user` cambia y el componente redirige solo.
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }

    setLoading(false);
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Bienvenido"
      subtitle="Inicia sesión para gestionar las programaciones."
      footer={
        <>
          ¿No tienes usuario? Pídelo al administrador del sistema.
          <span className="block mt-1 text-xs text-gray-400">
            Primera instalación:{' '}
            <Link to="/register" className="text-brand-600 hover:underline">
              crear el administrador
            </Link>
          </span>
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="usuario" className="mb-2 block text-sm font-medium text-gray-700">
            Usuario
          </label>
          <div className="relative">
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="text"
              id="usuario"
              name="usuario"
              autoComplete="username"
              autoFocus
              value={formData.usuario}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ingresa tu usuario"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative">
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ingresa tu contraseña"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition-all cursor-pointer hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              Iniciando sesión...
            </span>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
