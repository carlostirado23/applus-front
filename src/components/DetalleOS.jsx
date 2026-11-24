import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import useMensaje from '../hooks/useMensaje';
import { aInputFecha, esInsertar, ESTADOS_EJECUCION, formatFecha, formatFechaHora } from '../utils/programaciones';
import Alerta from './Alerta';
import { EstadoEjecucionBadge, InsertarBadge, TecnicoBadge, ValidacionBadge } from './Badges';
import Confirmar from './Confirmar';
import Icon from './Icon';
import Modal from './Modal';
import SelectTecnico from './SelectTecnico';
import { btn, input, label, spinner } from './ui';

const Dato = ({ titulo, children }) => (
  <div>
    <dt className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{titulo}</dt>
    <dd className="mt-0.5 text-sm text-gray-800">{children ?? '—'}</dd>
  </div>
);

const CAMPOS_EDITABLES = ['nombre', 'nic', 'direccion', 'barrio', 'municipio', 'fecha_estimada_resolucion'];

/**
 * Detalle completo de una OS con trazabilidad y acciones:
 * - PENDIENTE (no duplicada): editar datos, asignar técnico, eliminar.
 * - PUBLICADO: reasignar técnico, registrar resultado.
 * `onChange(programacion | null)` avisa a la página cuando algo cambió (null = eliminada).
 */
const DetalleOS = ({ id, open, onClose, onChange, modoInicial = '' }) => {
  const [prog, setProg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState(''); // '', 'editar', 'tecnico', 'resultado', 'eliminar'
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const { mensaje, mostrar, limpiar } = useMensaje();

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProg(await apiFetch(`/programaciones/${id}`));
    } catch (e) {
      mostrar('error', e.message);
    } finally {
      setLoading(false);
    }
  }, [id, mostrar]);

  useEffect(() => {
    if (open) {
      setModo('');
      limpiar();
      cargar();
    } else {
      setProg(null);
    }
  }, [open, cargar, limpiar]);

  const abrirModo = useCallback(
    (nuevo, p = prog) => {
      limpiar();
      if (nuevo === 'editar') setForm(Object.fromEntries(CAMPOS_EDITABLES.map((c) => [c, c === 'fecha_estimada_resolucion' ? aInputFecha(p[c]) : p[c] ?? ''])));
      if (nuevo === 'tecnico') setForm({ tecnico_id: p.tecnico_id ? String(p.tecnico_id) : '' });
      if (nuevo === 'resultado') {
        setForm({
          estado_ejecucion: p.estado_ejecucion === 'SIN_RESULTADO' ? 'EJECUTADA' : p.estado_ejecucion,
          fecha_ejecucion: aInputFecha(p.fecha_ejecucion),
          observaciones: p.observaciones ?? '',
        });
      }
      setModo(nuevo);
    },
    [prog, limpiar],
  );

  // Modo inicial pedido por la página (p. ej. "tecnico" desde el botón Asignar técnico), aplicable según el estado de la OS
  useEffect(() => {
    if (!open || !prog || !modoInicial) return;
    const duplicadaOs = !esInsertar(prog.insertar);
    const permitido =
      (modoInicial === 'tecnico' && !duplicadaOs) ||
      (modoInicial === 'editar' && prog.validacion === 'PENDIENTE' && !duplicadaOs) ||
      (modoInicial === 'resultado' && prog.validacion === 'PUBLICADO');
    if (permitido) abrirModo(modoInicial, prog);
    // Solo al abrir con datos cargados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prog?.id, modoInicial]);

  const guardar = async (path, body, exito) => {
    setBusy(true);
    try {
      const data = await apiFetch(path, { method: body === undefined ? 'DELETE' : path.endsWith('/resultado') ? 'POST' : 'PATCH', body });
      if (path.endsWith(`/${id}`) && body === undefined) {
        onChange?.(null);
        onClose();
        return;
      }
      setProg(data.programacion);
      onChange?.(data.programacion);
      setModo('');
      mostrar('success', exito);
    } catch (e) {
      mostrar('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  const pendiente = prog?.validacion === 'PENDIENTE';
  const publicada = prog?.validacion === 'PUBLICADO';
  const duplicada = prog && !esInsertar(prog.insertar);
  const campo = (name) => ({ name, value: form[name] ?? '', onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })), className: input });

  return (
    <>
      <Modal open={open} onClose={onClose} title={prog ? `OS ${prog.numero_os}` : 'Detalle de la OS'} size="lg">
        <Alerta mensaje={mensaje} />
        {loading || !prog ? (
          <div className="flex justify-center py-10">{loading && <div className={spinner} />}</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <ValidacionBadge value={prog.validacion} />
              <InsertarBadge value={prog.insertar} />
              {publicada && <EstadoEjecucionBadge value={prog.estado_ejecucion} />}
              {duplicada && <span className="text-xs text-red-700">OS duplicada: queda como histórico, no se asigna ni se publica.</span>}
            </div>

            {modo === '' && (
              <div className="flex flex-wrap gap-2">
                {pendiente && !duplicada && (
                  <>
                    <button type="button" onClick={() => abrirModo('editar')} className={btn.secundario}>
                      <Icon name="edit" className="w-4 h-4" /> Editar datos
                    </button>
                    <button type="button" onClick={() => abrirModo('tecnico')} className={btn.secundario}>
                      <Icon name="userCheck" className="w-4 h-4" /> {prog.tecnico_id ? 'Cambiar técnico' : 'Asignar técnico'}
                    </button>
                  </>
                )}
                {pendiente && (
                  <button type="button" onClick={() => setModo('eliminar')} className={`${btn.secundario} text-red-600! border-red-200 hover:bg-red-50`}>
                    <Icon name="trash" className="w-4 h-4" /> Eliminar
                  </button>
                )}
                {publicada && (
                  <>
                    <button type="button" onClick={() => abrirModo('resultado')} className={btn.primario}>
                      <Icon name="clipboard" className="w-4 h-4" /> Registrar resultado
                    </button>
                    <button type="button" onClick={() => abrirModo('tecnico')} className={btn.secundario}>
                      <Icon name="userCheck" className="w-4 h-4" /> Reasignar técnico
                    </button>
                  </>
                )}
              </div>
            )}

            {modo === 'editar' && (
              <form
                className="grid grid-cols-1 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar(`/programaciones/${id}`, { ...form, fecha_estimada_resolucion: form.fecha_estimada_resolucion || null }, 'Datos actualizados');
                }}
              >
                <div className="sm:col-span-2"><label className={label}>Nombre del cliente</label><input {...campo('nombre')} /></div>
                <div><label className={label}>NIC</label><input {...campo('nic')} /></div>
                <div><label className={label}>Fecha estimada</label><input type="date" {...campo('fecha_estimada_resolucion')} /></div>
                <div className="sm:col-span-2"><label className={label}>Dirección</label><input {...campo('direccion')} /></div>
                <div><label className={label}>Barrio</label><input {...campo('barrio')} /></div>
                <div><label className={label}>Municipio</label><input {...campo('municipio')} /></div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <button type="button" onClick={() => setModo('')} disabled={busy} className={btn.secundario}>Cancelar</button>
                  <button type="submit" disabled={busy} className={btn.primario}>{busy ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </form>
            )}

            {modo === 'tecnico' && (
              <form
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.tecnico_id) return mostrar('error', 'Selecciona un técnico');
                  guardar(`/programaciones/${id}`, { tecnico_id: Number(form.tecnico_id) }, 'Técnico asignado');
                }}
              >
                <label className={label}>Técnico</label>
                <SelectTecnico value={form.tecnico_id} onChange={(v) => setForm({ tecnico_id: v })} autoFocus />
                {prog.asignado_a && <p className="mt-2 text-xs text-gray-500">En el Excel venía como: <span className="font-medium">{prog.asignado_a}</span></p>}
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={() => setModo('')} disabled={busy} className={btn.secundario}>Cancelar</button>
                  <button type="submit" disabled={busy} className={btn.primario}>{busy ? 'Guardando...' : 'Asignar'}</button>
                </div>
              </form>
            )}

            {modo === 'resultado' && (
              <form
                className="grid grid-cols-1 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar(`/programaciones/${id}/resultado`, { ...form, fecha_ejecucion: form.fecha_ejecucion || null }, 'Resultado registrado');
                }}
              >
                <div>
                  <label className={label}>Estado</label>
                  <select {...campo('estado_ejecucion')}>
                    {Object.entries(ESTADOS_EJECUCION).filter(([k]) => k !== 'SIN_RESULTADO').map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div><label className={label}>Fecha de ejecución</label><input type="date" {...campo('fecha_ejecucion')} /></div>
                <div className="sm:col-span-2">
                  <label className={label}>Observaciones</label>
                  <textarea rows={3} maxLength={1000} {...campo('observaciones')} />
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <button type="button" onClick={() => setModo('')} disabled={busy} className={btn.secundario}>Cancelar</button>
                  <button type="submit" disabled={busy} className={btn.primario}>{busy ? 'Guardando...' : 'Guardar resultado'}</button>
                </div>
              </form>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Cliente y sitio</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Dato titulo="NIC">{prog.nic}</Dato>
                <Dato titulo="Nombre">{prog.nombre}</Dato>
                <Dato titulo="Formulario">{prog.formulario}</Dato>
                <Dato titulo="Dirección">{prog.direccion}</Dato>
                <Dato titulo="Barrio">{prog.barrio}</Dato>
                <Dato titulo="Municipio">{prog.municipio}</Dato>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Asignación</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Dato titulo="Técnico"><TecnicoBadge programacion={prog} /></Dato>
                <Dato titulo="Asignado a (Excel)">{prog.asignado_a}</Dato>
                <Dato titulo="Fecha estimada">{formatFecha(prog.fecha_estimada_resolucion)}</Dato>
                {prog.tecnico?.telefono && <Dato titulo="Teléfono técnico">{prog.tecnico.telefono}</Dato>}
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Trazabilidad</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Dato titulo="Cargada por">{prog.creado_por}</Dato>
                <Dato titulo="Fecha de carga">{formatFechaHora(prog.fecha_creacion)}</Dato>
                <Dato titulo="Última modificación">{formatFechaHora(prog.fecha_actualizacion)}</Dato>
                <Dato titulo="Publicada por">{prog.publicado_por}</Dato>
                <Dato titulo="Fecha de publicación">{prog.fecha_publicacion ? formatFechaHora(prog.fecha_publicacion) : '—'}</Dato>
                <Dato titulo="Vista por el técnico">{prog.fecha_vista ? formatFechaHora(prog.fecha_vista) : publicada ? 'Aún no' : '—'}</Dato>
              </dl>
            </section>

            {publicada && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Resultado</h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Dato titulo="Estado"><EstadoEjecucionBadge value={prog.estado_ejecucion} /></Dato>
                  <Dato titulo="Fecha de ejecución">{formatFecha(prog.fecha_ejecucion)}</Dato>
                  <Dato titulo="Registrado por">{prog.resultado_por}</Dato>
                  <Dato titulo="Fecha de registro">{prog.fecha_resultado ? formatFechaHora(prog.fecha_resultado) : '—'}</Dato>
                  <div className="sm:col-span-2 lg:col-span-3"><Dato titulo="Observaciones">{prog.observaciones}</Dato></div>
                </dl>
              </section>
            )}
          </div>
        )}
      </Modal>

      <Confirmar
        open={modo === 'eliminar'}
        onClose={() => setModo('')}
        onConfirm={() => guardar(`/programaciones/${id}`, undefined)}
        title="Eliminar programación"
        confirmText="Eliminar"
        peligro
        busy={busy}
      >
        Se eliminará la OS <strong>{prog?.numero_os}</strong> de la precarga. Esta acción no se puede deshacer.
      </Confirmar>
    </>
  );
};

export default DetalleOS;
