import { useCallback, useEffect, useState } from 'react';
import { apiDownload, apiFetch, query } from '../api/client';
import Alerta from '../components/Alerta';
import Icon from '../components/Icon';
import SelectTecnico from '../components/SelectTecnico';
import { btn, input, label, spinner, tarjeta, td, th } from '../components/ui';
import useMensaje from '../hooks/useMensaje';
import { hoy } from '../utils/programaciones';

/** "YYYY-MM-01" del mes actual en hora local. */
const inicioDeMes = () => `${hoy().slice(0, 7)}-01`;

const CAMPOS_FECHA = {
  fecha_estimada_resolucion: 'Fecha estimada de resolución',
  fecha_publicacion: 'Fecha de publicación',
  fecha_ejecucion: 'Fecha de ejecución',
};

const filtrosIniciales = () => ({
  campo_fecha: 'fecha_estimada_resolucion',
  fecha_inicial: inicioDeMes(),
  fecha_final: hoy(),
  agrupar: 'tecnico',
  tecnico_id: '',
});

const colorCumplimiento = (pct) => (pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500');

const Barra = ({ pct }) => (
  <div className="flex items-center gap-2 min-w-32">
    <div className="flex-1 h-2 overflow-hidden bg-gray-100 rounded-full">
      <div className={`h-full ${colorCumplimiento(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
    <span className="w-12 text-right text-sm font-semibold text-gray-800">{pct}%</span>
  </div>
);

const Reportes = () => {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { mensaje, mostrar } = useMensaje();

  const setFiltro = (k) => (v) => setFiltros((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }));
  const rangoInvalido = Boolean(filtros.fecha_inicial && filtros.fecha_final && filtros.fecha_inicial > filtros.fecha_final);

  const generar = useCallback(async (f) => {
    setLoading(true);
    try {
      setReporte(await apiFetch(`/programaciones/reporte${query(f)}`));
    } catch (err) {
      mostrar('error', `Error al generar el reporte: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [mostrar]);

  // Primera carga: mes actual por técnico
  useEffect(() => {
    generar(filtrosIniciales());
  }, [generar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rangoInvalido) return;
    generar(filtros);
  };

  const handleExcel = async () => {
    if (rangoInvalido) return;
    setBusy(true);
    try {
      const nombre = await apiDownload(`/programaciones/reporte${query(filtros)}`, 'reporte.xlsx');
      mostrar('success', `Archivo ${nombre} descargado`);
    } catch (err) {
      mostrar('error', `Error al descargar: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const t = reporte?.totales;
  const porTecnico = reporte?.agrupar === 'tecnico';
  const tarjetas = [
    { titulo: 'Total OS', valor: t?.total, color: 'bg-brand-100 text-brand-600', icon: 'layers' },
    { titulo: 'Ejecutadas', valor: t?.EJECUTADA, color: 'bg-green-100 text-green-600', icon: 'checkCircle' },
    { titulo: 'No ejecutadas', valor: t?.NO_EJECUTADA, color: 'bg-red-100 text-red-600', icon: 'xCircle' },
    { titulo: 'Reprogramadas', valor: t?.REPROGRAMADA, color: 'bg-blue-100 text-blue-600', icon: 'rotate' },
    { titulo: 'Sin resultado', valor: t?.SIN_RESULTADO, color: 'bg-gray-200 text-gray-600', icon: 'clock' },
    { titulo: 'Cumplimiento', valor: t ? `${t.cumplimiento}%` : undefined, color: 'bg-emerald-100 text-emerald-600', icon: 'barChart' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Reportes de cumplimiento</h1>
        <p className="text-gray-600">Resultados de las OS publicadas, agrupados por técnico o municipio</p>
      </div>

      <Alerta mensaje={mensaje} />

      <form className={`${tarjeta} mb-6`} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="campo_fecha" className={label}>Filtrar fecha por</label>
            <select id="campo_fecha" value={filtros.campo_fecha} onChange={setFiltro('campo_fecha')} className={input}>
              {Object.entries(CAMPOS_FECHA).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fecha_inicial" className={label}>Desde</label>
            <input id="fecha_inicial" type="date" value={filtros.fecha_inicial} max={filtros.fecha_final || undefined} onChange={setFiltro('fecha_inicial')} className={input} />
          </div>
          <div>
            <label htmlFor="fecha_final" className={label}>Hasta</label>
            <input id="fecha_final" type="date" value={filtros.fecha_final} min={filtros.fecha_inicial || undefined} onChange={setFiltro('fecha_final')} className={input} />
          </div>
          <div>
            <label htmlFor="agrupar" className={label}>Agrupar por</label>
            <select id="agrupar" value={filtros.agrupar} onChange={setFiltro('agrupar')} className={input}>
              <option value="tecnico">Técnico</option>
              <option value="municipio">Municipio</option>
            </select>
          </div>
          <div>
            <label htmlFor="tecnico" className={label}>Técnico</label>
            <SelectTecnico id="tecnico" value={filtros.tecnico_id} onChange={setFiltro('tecnico_id')} opcionTodos />
          </div>
        </div>
        {rangoInvalido && <p className="mt-2 text-sm text-red-600">La fecha inicial no puede ser mayor que la fecha final.</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="submit" disabled={loading || rangoInvalido} className={btn.primario}>
            <Icon name="barChart" className="w-4 h-4" />
            {loading ? 'Generando...' : 'Generar'}
          </button>
          <button type="button" onClick={handleExcel} disabled={busy || rangoInvalido} className={btn.secundario}>
            <Icon name="download" className="w-4 h-4" />
            {busy ? 'Descargando...' : 'Descargar Excel'}
          </button>
          {(filtros.fecha_inicial || filtros.fecha_final) && (
            <button
              type="button"
              onClick={() => {
                const sinFechas = { ...filtros, fecha_inicial: '', fecha_final: '' };
                setFiltros(sinFechas);
                generar(sinFechas);
              }}
              disabled={loading}
              className={btn.secundario}
            >
              <Icon name="x" className="w-4 h-4" />
              Quitar fechas
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Solo cuenta OS publicadas. El rango aplica sobre la {CAMPOS_FECHA[filtros.campo_fecha].toLowerCase()}; sin fechas se incluyen todas.
        </p>
      </form>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3 lg:grid-cols-6">
        {tarjetas.map((c) => (
          <div key={c.titulo} className="p-4 bg-white shadow-md rounded-xl">
            <div className={`${c.color} flex items-center justify-center w-10 h-10 mb-3 rounded-lg`}>
              <Icon name={c.icon} className="w-5 h-5" />
            </div>
            <h3 className="mb-1 text-xs font-medium text-gray-600">{c.titulo}</h3>
            <p className="text-2xl font-bold text-gray-800">{loading && !reporte ? '…' : c.valor ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden bg-white shadow-md rounded-xl">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            Detalle por {porTecnico ? 'técnico' : 'municipio'}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={spinner} />
          </div>
        ) : !reporte?.detalle?.length ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No hay OS publicadas que cumplan los filtros.</p>
            {(reporte?.fecha_inicial || reporte?.fecha_final) && (
              <p className="mt-1 text-sm">
                El rango aplica sobre la {CAMPOS_FECHA[reporte.campo_fecha]?.toLowerCase() || 'fecha estimada'}. Prueba otro campo de fecha o usa <strong>Quitar fechas</strong>.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={th}>{porTecnico ? 'Técnico' : 'Municipio'}</th>
                  {porTecnico && <th className={th}>Usuario</th>}
                  <th className={`${th} text-right`}>Total</th>
                  <th className={`${th} text-right`}>Ejecutadas</th>
                  <th className={`${th} text-right`}>No ejecutadas</th>
                  <th className={`${th} text-right`}>Reprogramadas</th>
                  <th className={`${th} text-right`}>Sin resultado</th>
                  <th className={th}>Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reporte.detalle.map((g, i) => (
                  <tr key={`${g.grupo}-${g.tecnico_id ?? i}`} className="hover:bg-gray-50">
                    <td className={`${td} font-medium text-gray-900`}>{g.grupo}</td>
                    {porTecnico && <td className={td}>{g.usuario || '—'}</td>}
                    <td className={`${td} text-right`}>{g.total}</td>
                    <td className={`${td} text-right text-green-700`}>{g.EJECUTADA}</td>
                    <td className={`${td} text-right text-red-700`}>{g.NO_EJECUTADA}</td>
                    <td className={`${td} text-right text-blue-700`}>{g.REPROGRAMADA}</td>
                    <td className={`${td} text-right`}>{g.SIN_RESULTADO}</td>
                    <td className={td}><Barra pct={g.cumplimiento} /></td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className={`${td} text-gray-900`}>Total</td>
                  {porTecnico && <td className={td} />}
                  <td className={`${td} text-right text-gray-900`}>{t.total}</td>
                  <td className={`${td} text-right text-green-700`}>{t.EJECUTADA}</td>
                  <td className={`${td} text-right text-red-700`}>{t.NO_EJECUTADA}</td>
                  <td className={`${td} text-right text-blue-700`}>{t.REPROGRAMADA}</td>
                  <td className={`${td} text-right text-gray-900`}>{t.SIN_RESULTADO}</td>
                  <td className={td}><Barra pct={t.cumplimiento} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Reportes;
