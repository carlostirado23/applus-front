import { useCallback, useEffect, useState } from 'react';
import { apiFetch, query } from '../api/client';
import Alerta from '../components/Alerta';
import { ActivoBadge, ROLES_LABEL, RolBadge } from '../components/Badges';
import Confirmar from '../components/Confirmar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import PasswordInput from '../components/PasswordInput';
import { btn, input, label, spinner, tarjeta, td, th } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import useMensaje from '../hooks/useMensaje';

const ROLES = Object.keys(ROLES_LABEL);
const FORM_VACIO = { nombre: '', email: '', usuario: '', rol: 'TECNICO', cedula: '', telefono: '', municipio: '', password: '', confirmar: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Usuarios = () => {
  const { user: actual } = useAuth();
  const { mensaje, mostrar } = useMensaje();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', rol: '', activo: '' });
  const [qAplicado, setQAplicado] = useState('');

  // Modal crear/editar: { usuario: null | objeto }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [busy, setBusy] = useState(false);

  // Modal reset contraseña
  const [reset, setReset] = useState(null);
  const [passReset, setPassReset] = useState({ password: '', confirmar: '' });
  const [errorReset, setErrorReset] = useState('');

  // Confirmar desactivación
  const [desactivar, setDesactivar] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await apiFetch(`/usuarios${query({ q: qAplicado, rol: filtros.rol, activo: filtros.activo })}`);
      setUsuarios(Array.isArray(lista) ? lista : []);
    } catch (e) {
      mostrar('error', `Error al cargar usuarios: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [qAplicado, filtros.rol, filtros.activo, mostrar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQAplicado(filtros.q.trim()), 300);
    return () => clearTimeout(t);
  }, [filtros.q]);

  // ───── crear / editar ─────
  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setErrorForm('');
    setModal({ usuario: null });
  };

  const abrirEditar = (u) => {
    setForm({ ...FORM_VACIO, nombre: u.nombre, email: u.email, usuario: u.usuario, rol: u.rol, cedula: u.cedula ?? '', telefono: u.telefono ?? '', municipio: u.municipio ?? '' });
    setErrorForm('');
    setModal({ usuario: u });
  };

  const campo = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
    className: input,
  });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    const esNuevo = !modal.usuario;
    if (!form.nombre.trim() || !form.email.trim() || !form.usuario.trim()) return setErrorForm('Nombre, email y usuario son obligatorios');
    if (!EMAIL.test(form.email.trim())) return setErrorForm('El email no es válido');
    if (esNuevo) {
      if (form.password.length < 8) return setErrorForm('La contraseña debe tener al menos 8 caracteres');
      if (form.password !== form.confirmar) return setErrorForm('Las contraseñas no coinciden');
    }

    const body = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      usuario: form.usuario.trim(),
      rol: form.rol,
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      municipio: form.municipio.trim(),
    };
    if (esNuevo) body.password = form.password;

    setBusy(true);
    try {
      const data = esNuevo
        ? await apiFetch('/usuarios', { method: 'POST', body })
        : await apiFetch(`/usuarios/${modal.usuario.id}`, { method: 'PUT', body });
      mostrar('success', data?.message || (esNuevo ? 'Usuario creado' : 'Usuario actualizado'));
      setModal(null);
      await cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ───── reset contraseña ─────
  const abrirReset = (u) => {
    setPassReset({ password: '', confirmar: '' });
    setErrorReset('');
    setReset(u);
  };

  const guardarReset = async (e) => {
    e.preventDefault();
    setErrorReset('');
    if (passReset.password.length < 8) return setErrorReset('La contraseña debe tener al menos 8 caracteres');
    if (passReset.password !== passReset.confirmar) return setErrorReset('Las contraseñas no coinciden');
    setBusy(true);
    try {
      const data = await apiFetch(`/usuarios/${reset.id}/password`, { method: 'POST', body: { password: passReset.password } });
      mostrar('success', data?.message || 'Contraseña restablecida');
      setReset(null);
    } catch (err) {
      setErrorReset(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ───── activar / desactivar ─────
  const cambiarActivo = async (u, activo) => {
    setBusy(true);
    try {
      const data = await apiFetch(`/usuarios/${u.id}/activo`, { method: 'PATCH', body: { activo } });
      mostrar('success', data?.message || (activo ? 'Usuario activado' : 'Usuario desactivado'));
      setDesactivar(null);
      await cargar();
    } catch (err) {
      mostrar('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  const hayFiltros = Boolean(filtros.q || filtros.rol || filtros.activo);

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Usuarios</h1>
        <p className="text-gray-600">Administradores, supervisores y técnicos del sistema</p>
      </div>

      <Alerta mensaje={mensaje} />

      <div className={`${tarjeta} mb-6`}>
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={(e) => { e.preventDefault(); setQAplicado(filtros.q.trim()); }}>
          <div className="flex-1 min-w-48">
            <label htmlFor="q" className={label}>Buscar</label>
            <input
              id="q"
              type="search"
              placeholder="Nombre, usuario, email, cédula o municipio..."
              value={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
              className={input}
            />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="rol" className={label}>Rol</label>
            <select id="rol" value={filtros.rol} onChange={(e) => setFiltros((f) => ({ ...f, rol: e.target.value }))} className={input}>
              <option value="">Todos</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLES_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="activo" className={label}>Estado</label>
            <select id="activo" value={filtros.activo} onChange={(e) => setFiltros((f) => ({ ...f, activo: e.target.value }))} className={input}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          {hayFiltros && (
            <button type="button" onClick={() => setFiltros({ q: '', rol: '', activo: '' })} className={btn.secundario}>
              Limpiar
            </button>
          )}
          <button type="button" onClick={abrirCrear} className={`${btn.primario} sm:ml-auto`}>
            <Icon name="plus" className="w-4 h-4" /> Nuevo usuario
          </button>
        </form>
      </div>

      <div className="overflow-hidden bg-white shadow-md rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className={spinner} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre', 'Usuario', 'Email', 'Rol', 'Cédula', 'Teléfono', 'Municipio', 'Estado', 'Acciones'].map((c) => (
                    <th key={c} className={th}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {hayFiltros ? 'No se encontraron usuarios con esos filtros.' : 'No hay usuarios registrados.'}
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => {
                    const esYo = u.id === actual?.id;
                    const gris = u.activo ? '' : 'text-gray-400';
                    return (
                      <tr key={u.id} className={`hover:bg-gray-50 ${u.activo ? '' : 'bg-gray-50/60'}`}>
                        <td className={`${td} font-medium ${u.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                          {u.nombre}
                          {esYo && <span className="ml-2 text-xs font-normal text-brand-600">(tú)</span>}
                        </td>
                        <td className={`${td} ${gris}`}>{u.usuario}</td>
                        <td className={`${td} ${gris}`}>{u.email}</td>
                        <td className={td}><RolBadge value={u.rol} /></td>
                        <td className={`${td} ${gris}`}>{u.cedula || '—'}</td>
                        <td className={`${td} ${gris}`}>{u.telefono || '—'}</td>
                        <td className={`${td} ${gris}`}>{u.municipio || '—'}</td>
                        <td className={td}><ActivoBadge value={u.activo} /></td>
                        <td className={td}>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => abrirEditar(u)} title="Editar" aria-label={`Editar ${u.usuario}`} className={btn.icono} disabled={busy}>
                              <Icon name="edit" className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => abrirReset(u)} title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${u.usuario}`} className={btn.icono} disabled={busy}>
                              <Icon name="key" className="w-4 h-4" />
                            </button>
                            {u.activo ? (
                              <button
                                type="button"
                                onClick={() => setDesactivar(u)}
                                title={esYo ? 'No puedes desactivar tu propio usuario' : 'Desactivar'}
                                aria-label={`Desactivar ${u.usuario}`}
                                className={`${btn.icono} hover:text-red-600!`}
                                disabled={busy || esYo}
                              >
                                <Icon name="xCircle" className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => cambiarActivo(u, true)}
                                title="Activar"
                                aria-label={`Activar ${u.usuario}`}
                                className={`${btn.icono} hover:text-green-600!`}
                                disabled={busy}
                              >
                                <Icon name="checkCircle" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && usuarios.length > 0 && (
        <div className="mt-4 text-sm text-center text-gray-600">Mostrando {usuarios.length} usuario{usuarios.length === 1 ? '' : 's'}</div>
      )}

      {/* Crear / editar */}
      <Modal
        open={Boolean(modal)}
        onClose={() => !busy && setModal(null)}
        title={modal?.usuario ? `Editar usuario: ${modal.usuario.usuario}` : 'Nuevo usuario'}
        footer={
          <>
            <button type="button" onClick={() => setModal(null)} disabled={busy} className={btn.secundario}>Cancelar</button>
            <button type="submit" form="form-usuario" disabled={busy} className={btn.primario}>
              {busy ? 'Guardando...' : modal?.usuario ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </>
        }
      >
        <form id="form-usuario" onSubmit={guardar} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {errorForm && <div className="sm:col-span-2"><Alerta type="error" className="mb-0!">{errorForm}</Alerta></div>}
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className={label}>Nombre completo *</label>
            <input type="text" autoComplete="off" autoFocus {...campo('nombre')} />
          </div>
          <div>
            <label htmlFor="email" className={label}>Email *</label>
            <input type="email" autoComplete="off" {...campo('email')} />
          </div>
          <div>
            <label htmlFor="usuario" className={label}>Usuario *</label>
            <input type="text" autoComplete="off" placeholder="letras, números, . _ -" {...campo('usuario')} />
          </div>
          <div>
            <label htmlFor="rol" className={label}>Rol *</label>
            <select {...campo('rol')} disabled={modal?.usuario?.id === actual?.id}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLES_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cedula" className={label}>Cédula</label>
            <input type="text" autoComplete="off" {...campo('cedula')} />
          </div>
          <div>
            <label htmlFor="telefono" className={label}>Teléfono</label>
            <input type="tel" autoComplete="off" {...campo('telefono')} />
          </div>
          <div>
            <label htmlFor="municipio" className={label}>Municipio / zona</label>
            <input type="text" autoComplete="off" {...campo('municipio')} />
          </div>
          {form.rol === 'TECNICO' && (
            <p className="flex items-start gap-2 text-xs text-gray-600 sm:col-span-2">
              <Icon name="info" className="w-4 h-4 mt-0.5 text-brand-600" />
              El técnico se cruza con la columna ASIGNADO_A del Excel por usuario, cédula o nombre completo.
            </p>
          )}
          {!modal?.usuario && (
            <>
              <div>
                <label htmlFor="password" className={label}>Contraseña *</label>
                <PasswordInput autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...campo('password')} />
              </div>
              <div>
                <label htmlFor="confirmar" className={label}>Confirmar contraseña *</label>
                <PasswordInput autoComplete="new-password" {...campo('confirmar')} />
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Restablecer contraseña */}
      <Modal
        open={Boolean(reset)}
        onClose={() => !busy && setReset(null)}
        title={`Restablecer contraseña: ${reset?.usuario ?? ''}`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setReset(null)} disabled={busy} className={btn.secundario}>Cancelar</button>
            <button type="submit" form="form-reset" disabled={busy} className={btn.primario}>{busy ? 'Guardando...' : 'Restablecer'}</button>
          </>
        }
      >
        <form id="form-reset" onSubmit={guardarReset} noValidate className="space-y-4">
          {errorReset && <Alerta type="error" className="mb-0!">{errorReset}</Alerta>}
          <p className="text-sm text-gray-600">El usuario <strong>{reset?.nombre}</strong> deberá ingresar con la nueva contraseña.</p>
          <div>
            <label htmlFor="reset-password" className={label}>Contraseña nueva</label>
            <PasswordInput id="reset-password" autoComplete="new-password" autoFocus placeholder="Mínimo 8 caracteres" value={passReset.password} onChange={(e) => setPassReset((p) => ({ ...p, password: e.target.value }))} className={input} />
          </div>
          <div>
            <label htmlFor="reset-confirmar" className={label}>Confirmar contraseña</label>
            <PasswordInput id="reset-confirmar" autoComplete="new-password" value={passReset.confirmar} onChange={(e) => setPassReset((p) => ({ ...p, confirmar: e.target.value }))} className={input} />
          </div>
        </form>
      </Modal>

      {/* Desactivar */}
      <Confirmar
        open={Boolean(desactivar)}
        onClose={() => setDesactivar(null)}
        onConfirm={() => cambiarActivo(desactivar, false)}
        title="Desactivar usuario"
        confirmText="Desactivar"
        peligro
        busy={busy}
      >
        <strong>{desactivar?.nombre}</strong> ({desactivar?.usuario}) no podrá iniciar sesión ni usar la app. Sus OS asignadas se conservan y puedes volver a activarlo cuando quieras.
      </Confirmar>
    </>
  );
};

export default Usuarios;
