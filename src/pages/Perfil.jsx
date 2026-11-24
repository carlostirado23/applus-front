import { useState } from 'react';
import { apiFetch } from '../api/client';
import Alerta from '../components/Alerta';
import { RolBadge } from '../components/Badges';
import PasswordInput from '../components/PasswordInput';
import { btn, input, label, tarjeta } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import useMensaje from '../hooks/useMensaje';

const Perfil = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [busy, setBusy] = useState(false);
  const { mensaje, mostrar } = useMensaje();

  const campo = (name) => ({ id: name, name, value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })), className: input });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.actual || !form.nueva) return mostrar('error', 'Completa todos los campos');
    if (form.nueva.length < 8) return mostrar('error', 'La contraseña nueva debe tener al menos 8 caracteres');
    if (form.nueva !== form.confirmar) return mostrar('error', 'Las contraseñas nuevas no coinciden');
    setBusy(true);
    try {
      const data = await apiFetch('/auth/password', { method: 'PUT', body: { password_actual: form.actual, password_nueva: form.nueva } });
      mostrar('success', data?.message || 'Contraseña actualizada');
      setForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      mostrar('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Mi perfil</h1>
        <p className="text-gray-600">Tus datos de acceso al sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={tarjeta}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Datos</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs font-semibold text-gray-500 uppercase">Nombre</dt><dd className="text-gray-800">{user?.nombre}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500 uppercase">Usuario</dt><dd className="text-gray-800">{user?.usuario}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500 uppercase">Email</dt><dd className="text-gray-800">{user?.email}</dd></div>
            <div><dt className="text-xs font-semibold text-gray-500 uppercase">Rol</dt><dd><RolBadge value={user?.rol} /></dd></div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">Para cambiar nombre o email, pide al administrador que edite tu usuario.</p>
        </div>

        <form className={tarjeta} onSubmit={handleSubmit} noValidate>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Cambiar contraseña</h2>
          <Alerta mensaje={mensaje} />
          <div className="space-y-4">
            <div>
              <label htmlFor="actual" className={label}>Contraseña actual</label>
              <PasswordInput {...campo('actual')} autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="nueva" className={label}>Contraseña nueva</label>
              <PasswordInput {...campo('nueva')} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label htmlFor="confirmar" className={label}>Confirmar contraseña nueva</label>
              <PasswordInput {...campo('confirmar')} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={busy} className={btn.primario}>
              {busy ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Perfil;
