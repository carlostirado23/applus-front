import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    usuario: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, register, login } = useAuth();

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

    if (!formData.nombre || !formData.email || !formData.usuario || !formData.password) {
      setError('Por favor, complete todos los campos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.nombre,
      formData.email,
      formData.usuario,
      formData.password
    );

    if (!result.success) {
      setError(result.error || 'Error al registrarse');
    } else if (!result.data?.token) {
      // /auth/register no devuelve token: se inicia sesión con las mismas credenciales.
      const sesion = await login(formData.usuario.trim(), formData.password);
      if (!sesion.success) {
        navigate('/login', { replace: true });
        return;
      }
    }
    // Con sesión, `user` cambia y el componente redirige solo al dashboard.

    setLoading(false);
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Regístrate para comenzar."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Inicia sesión aquí
          </Link>
        </>
      }
    >
      <>

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              autoComplete="name"
              autoFocus
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              placeholder="Ingresa tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              autoComplete="username"
              value={formData.usuario}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              placeholder="Elige un usuario"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              placeholder="Confirma tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                Registrando...
              </span>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>
      </>
    </AuthLayout>
  );
};

export default Register;
