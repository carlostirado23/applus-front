import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiDownload, apiFetch, query } from '../api/client';
import Alerta from '../components/Alerta';
import { EstadoEjecucionBadge, TecnicoBadge } from '../components/Badges';
import DetalleOS from '../components/DetalleOS';
import Icon from '../components/Icon';
import Paginacion from '../components/Paginacion';
import SelectTecnico from '../components/SelectTecnico';
import { btn, input, label, spinner, tarjeta, td, th } from '../components/ui';
import useMensaje from '../hooks/useMensaje';
import {
  ESTADOS_EJECUCION,
  fetchProgramaciones,
  formatFecha,
  paramsProgramaciones,
  validarExcel,
} from '../utils/programaciones';

const LIMIT = 25;

const CAMPOS_FECHA = [
  { value: 'fecha_estimada_resolucion', label: 'Fecha estimada' },
  { value: 'fecha_publicacion', label: 'Fecha de publicación' },
];

/** "YYYY-MM-DD" de ayer en hora local. */
const ayer = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const filtrosIniciales = (vencidas) => ({
  fechaInicio: '',
  fechaFin: vencidas ? ayer() : '',
  campoFecha: 'fecha_estimada_resolucion',
  tecnico_id: '',
  estado_ejecucion: 'SIN_RESULTADO',
});

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const vencidas = searchParams.get('vencidas') === '1';

  // Lo que se está editando en el formulario
  const [filtros, setFiltros] = useState(() => filtrosIniciales(vencidas));
  // Lo que ya se consultó (la tabla usa esto, no lo que se escribe)
  const [aplicados, setAplicados] = useState(() => filtrosIniciales(vencidas));
  const [page, setPage] = useState(1);
  const [listado, setListado] = useState({ data: [], total: 0, page: 1, limit: LIMIT, paginas: 1 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(''); // '', 'exportar', 'cargar'
  const [errores, setErrores] = useState([]);
  const [detalleId, setDetalleId] = useState(null);
  const { mensaje, mostrar } = useMensaje();
  const inputFile = useRef(null);

  const setFiltro = (k) => (v) => setFiltros((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }));

  const cargarListado = useCallback(async (f, p) => {
    setLoading(true);
    try {
      const data = await fetchProgramaciones({ ...f, validacion: 'PUBLICADO', page: p, limit: LIMIT });
      setListado(data);
    } catch (err) {
      mostrar('error', `Error al cargar las OS: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [mostrar]);

  useEffect(() => {
    cargarListado(aplicados, page);
  }, [cargarListado, aplicados, page]);

  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPage(1);
    setAplicados(filtros);
  };

  const limpiar = () => {
    const base = filtrosIniciales(false);
    setFiltros(base);
    setAplicados(base);
    setPage(1);
  };

  const handleExportar = async () => {
    setBusy('exportar');
    try {
      const nombre = await apiDownload(`/programaciones/exportar${query(paramsProgramaciones(filtros))}`, 'programaciones.xlsx');
      mostrar('success', `Archivo ${nombre} descargado. Diligéncialo y cárgalo en el paso 2.`);
    } catch (err) {
      mostrar('error', `Error al exportar: ${err.message}`);
    } finally {
      setBusy('');
    }
  };

  const handleCargar = async (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;
    const invalido = validarExcel(file);
    if (invalido) {
      mostrar('error', invalido);
      input.value = '';
      return;
    }

    setBusy('cargar');
    setErrores([]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await apiFetch('/programaciones/cargar-resultados', { method: 'POST', body: formData });
      const ignoradas = data?.sin_resultado ? ` ${data.sin_resultado} fila(s) sin estado se ignoraron.` : '';
      mostrar('success', `${data?.message || 'Resultados cargados'}.${ignoradas}`);
      await cargarListado(aplicados, page);
    } catch (err) {
      setErrores(Array.isArray(err.detalles) ? err.detalles : []);
      mostrar('error', err.message);
    } finally {
      setBusy('');
      input.value = ''; // permite volver a elegir el mismo archivo
    }
  };

  // Una OS cambió desde el detalle: se refresca solo esa fila
  const handleCambioDetalle = (prog) => {
    if (!prog) return cargarListado(aplicados, page);
    setListado((l) => ({ ...l, data: l.data.map((p) => (p.id === prog.id ? prog : p)) }));
  };

  const isBusy = busy !== '';
  const hayFiltros = Boolean(aplicados.fechaInicio || aplicados.fechaFin || aplicados.tecnico_id || aplicados.estado_ejecucion);

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Resultados de ejecución</h1>
        <p className="text-gray-600">Exporta las OS publicadas, diligencia el resultado en Excel y vuelve a cargarlo</p>
      </div>

      <Alerta mensaje={mensaje} />
      {vencidas && (
        <Alerta type="info">Mostrando OS vencidas sin resultado (fecha estimada anterior a hoy).</Alerta>
      )}

      <form className={`${tarjeta} mb-6`} onSubmit={aplicarFiltros}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Paso 1: exportar */}
          <div>
            <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-800">
              <span className="flex items-center justify-center w-7 h-7 text-sm text-white rounded-full bg-brand-600">1</span>
              Exportar Excel
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="campoFecha" className={label}>Filtrar fecha por</label>
                <select id="campoFecha" value={filtros.campoFecha} onChange={setFiltro('campoFecha')} className={input}>
                  {CAMPOS_FECHA.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="estado" className={label}>Estado</label>
                <select id="estado" value={filtros.estado_ejecucion} onChange={setFiltro('estado_ejecucion')} className={input}>
                  <option value="">Todos</option>
                  {Object.entries(ESTADOS_EJECUCION).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fechaInicio" className={label}>Desde</label>
                <input id="fechaInicio" type="date" value={filtros.fechaInicio} max={filtros.fechaFin || undefined} onChange={setFiltro('fechaInicio')} className={input} />
              </div>
              <div>
                <label htmlFor="fechaFin" className={label}>Hasta</label>
                <input id="fechaFin" type="date" value={filtros.fechaFin} min={filtros.fechaInicio || undefined} onChange={setFiltro('fechaFin')} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tecnico" className={label}>Técnico</label>
                <SelectTecnico id="tecnico" value={filtros.tecnico_id} onChange={setFiltro('tecnico_id')} opcionTodos />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={handleExportar} disabled={isBusy} className={btn.oscuro}>
                <Icon name="download" className="w-4 h-4" />
                {busy === 'exportar' ? 'Descargando...' : 'Descargar Excel'}
              </button>
              <button type="submit" disabled={isBusy} className={btn.secundario}>
                <Icon name="filter" className="w-4 h-4" /> Aplicar filtros
              </button>
              {hayFiltros && (
                <button type="button" onClick={limpiar} disabled={isBusy} className={btn.secundario}>
                  Limpiar
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Por defecto se exportan las OS sin resultado: solo lo que falta diligenciar.</p>
          </div>

          {/* Paso 2: cargar */}
          <div className="pt-6 border-t border-gray-200 lg:pt-0 lg:pl-6 lg:border-t-0 lg:border-l">
            <h2 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-800">
              <span className="flex items-center justify-center w-7 h-7 text-sm text-white rounded-full bg-brand-600">2</span>
              Cargar Excel diligenciado
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Diligencia las columnas <span className="font-semibold">ESTADO_EJECUCION</span>,{' '}
              <span className="font-semibold">FECHA_EJECUCION</span> y <span className="font-semibold">OBSERVACIONES</span>.
              No cambies la columna <span className="font-semibold">ID</span>: es la que cruza cada fila con su OS.
            </p>
            <label
              className={`${btn.primario} w-full sm:w-auto focus-within:ring-2 focus-within:ring-brand-500/50 ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon name="upload" className="w-4 h-4" />
              {busy === 'cargar' ? 'Cargando...' : 'Cargar Excel'}
              <input ref={inputFile} type="file" accept=".xlsx" onChange={handleCargar} disabled={isBusy} className="sr-only" />
            </label>
            <ul className="mt-4 space-y-1 text-xs text-gray-500 list-disc list-inside">
              <li>Estados válidos: Ejecutada, No ejecutada, Reprogramada.</li>
              <li>Las filas sin estado se ignoran.</li>
              <li>Si alguna fila tiene error no se guarda ninguna: corrige y vuelve a cargar.</li>
            </ul>
          </div>
        </div>

        {errores.length > 0 && (
          <div className="mt-6">
            <Alerta type="error">No se guardó ningún resultado. Corrige estas filas y vuelve a cargar el archivo.</Alerta>
            <div className="overflow-x-auto border border-red-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className={th}>Fila</th>
                    <th className={th}>Motivo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {errores.map((e, i) => (
                    <tr key={`${e.fila}-${i}`}>
                      <td className={`${td} font-medium text-gray-900`}>{e.fila}</td>
                      <td className={`${td} whitespace-normal`}>{e.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>

      <div className="overflow-hidden bg-white shadow-md rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">OS publicadas</h2>
          <span className="text-sm text-gray-500">{listado.total} en total</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={spinner} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Número OS', 'Nombre', 'Municipio', 'Técnico', 'F. Est. Resol', 'Estado', 'Fecha ejecución', 'Observaciones', 'Vista', ''].map((c, i) => (
                      <th key={`${c}-${i}`} className={th}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listado.data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        {hayFiltros ? 'No hay OS publicadas con esos filtros.' : 'No hay OS publicadas aún.'}
                      </td>
                    </tr>
                  ) : (
                    listado.data.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className={`${td} font-medium text-gray-900`}>{p.numero_os}</td>
                        <td className={td}>{p.nombre || '—'}</td>
                        <td className={td}>{p.municipio || '—'}</td>
                        <td className={td}><TecnicoBadge programacion={p} /></td>
                        <td className={td}>{formatFecha(p.fecha_estimada_resolucion)}</td>
                        <td className={td}><EstadoEjecucionBadge value={p.estado_ejecucion} /></td>
                        <td className={td}>{formatFecha(p.fecha_ejecucion)}</td>
                        <td className={`${td} max-w-xs truncate`} title={p.observaciones || undefined}>{p.observaciones || '—'}</td>
                        <td className={`${td} text-center`}>
                          {p.fecha_vista ? (
                            <Icon name="check" className="inline w-4 h-4 text-green-600" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className={td}>
                          <button type="button" onClick={() => setDetalleId(p.id)} className={btn.icono} title="Ver detalle" aria-label={`Ver OS ${p.numero_os}`}>
                            <Icon name="eye" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Paginacion {...listado} onChange={setPage} disabled={loading} />
          </>
        )}
      </div>

      <DetalleOS id={detalleId} open={detalleId !== null} onClose={() => setDetalleId(null)} onChange={handleCambioDetalle} />
    </>
  );
};

export default Resultados;
