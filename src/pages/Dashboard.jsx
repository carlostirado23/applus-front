import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, query } from '../api/client';
import Alerta from '../components/Alerta';
import Icon from '../components/Icon';
import { input, label, spinner, tarjeta, td, th } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ESTADOS_EJECUCION, formatFecha, hoy } from '../utils/programaciones';

const Tarjeta = ({ title, value, color, icon, to, hint }) => {
  const contenido = (
    <>
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value ?? '…'}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </>
  );
  const clase = 'block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow';
  return to ? <Link to={to} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
};

const Dashboard = () => {
  const { esAdmin } = useAuth();
  const [fecha, setFecha] = useState(hoy);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async (dia) => {
    setLoading(true);
    setError('');
    try {
      setResumen(await apiFetch(`/programaciones/resumen${query({ fecha: dia })}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(fecha);
  }, [cargar, fecha]);

  const r = resumen;
  const ej = r?.ejecucion;
  const tarjetas = [
    { title: 'Pendientes por publicar', value: r?.pendientes, color: 'bg-amber-100 text-amber-600', icon: 'clock', to: '/precargar' },
    { title: 'Sin técnico asignado', value: r?.sin_tecnico, color: 'bg-orange-100 text-orange-600', icon: 'alert', to: '/precargar', hint: 'Pendientes que no se pueden publicar' },
    { title: 'Publicadas', value: r?.publicadas, color: 'bg-green-100 text-green-600', icon: 'checkCircle', to: '/historico' },
    { title: 'Vencidas sin resultado', value: r?.vencidas, color: 'bg-red-100 text-red-600', icon: 'xCircle', to: `/resultados${query({ vencidas: 1 })}`, hint: 'Fecha estimada pasada' },
    { title: 'Ejecutadas', value: ej?.EJECUTADA, color: 'bg-emerald-100 text-emerald-600', icon: 'clipboard', to: '/resultados' },
    { title: 'No ejecutadas', value: ej?.NO_EJECUTADA, color: 'bg-rose-100 text-rose-600', icon: 'rotate', to: '/resultados' },
    { title: 'OS duplicadas', value: r?.duplicadas, color: 'bg-gray-200 text-gray-600', icon: 'layers', hint: 'Histórico, no se publican' },
    { title: 'Técnicos activos', value: r?.tecnicos_activos, color: 'bg-blue-100 text-blue-600', icon: 'users', to: esAdmin ? '/usuarios' : undefined },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Vista general de la operación</p>
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="fecha" className={label}>Día de operación</label>
          <input id="fecha" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} className={input} />
        </div>
      </div>

      {error && <Alerta type="error">No se pudieron cargar las estadísticas: {error}</Alerta>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {tarjetas.map((t) => (
          <Tarjeta key={t.title} {...t} value={loading && !r ? null : t.value ?? (error ? '—' : 0)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-3">
        <div className={`${tarjeta} xl:col-span-2 p-0! overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Trabajo del {formatFecha(r?.fecha || fecha)}</h2>
              <p className="text-xs text-gray-500">OS publicadas con fecha estimada ese día, por técnico</p>
            </div>
            <span className="text-sm font-semibold text-gray-700">{r?.del_dia?.total ?? 0} OS</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><div className={spinner} /></div>
          ) : !r?.del_dia?.por_tecnico?.length ? (
            <p className="px-6 py-8 text-sm text-center text-gray-500">No hay OS publicadas para ese día.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={th}>Técnico</th>
                    <th className={`${th} text-right`}>OS</th>
                    <th className={`${th} text-right`}>Vistas en app</th>
                    <th className={`${th} text-right`}>Ejecutadas</th>
                    <th className={`${th} text-right`}>No ejecutadas</th>
                    <th className={`${th} text-right`}>Reprogramadas</th>
                    <th className={`${th} text-right`}>Sin resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {r.del_dia.por_tecnico.map((t) => (
                    <tr key={t.tecnico_id ?? 'sin'} className="hover:bg-gray-50">
                      <td className={`${td} font-medium text-gray-900`}>
                        {t.tecnico_id ? (
                          <Link to={`/historico${query({ tecnico_id: t.tecnico_id, fecha: r.fecha })}`} className="hover:text-brand-700 hover:underline">{t.nombre}</Link>
                        ) : t.nombre}
                      </td>
                      <td className={`${td} text-right`}>{t.total}</td>
                      <td className={`${td} text-right`}>{t.vistas}/{t.total}</td>
                      <td className={`${td} text-right text-green-700`}>{t.EJECUTADA}</td>
                      <td className={`${td} text-right text-red-700`}>{t.NO_EJECUTADA}</td>
                      <td className={`${td} text-right text-blue-700`}>{t.REPROGRAMADA}</td>
                      <td className={`${td} text-right`}>{t.SIN_RESULTADO}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={tarjeta}>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Resultados acumulados</h2>
          <p className="mb-4 text-xs text-gray-500">Sobre {r?.publicadas ?? 0} OS publicadas</p>
          <ul className="space-y-3">
            {Object.entries(ESTADOS_EJECUCION).map(([k, nombre]) => {
              const n = ej?.[k] ?? 0;
              const pct = r?.publicadas ? Math.round((n / r.publicadas) * 100) : 0;
              const color = { EJECUTADA: 'bg-green-500', NO_EJECUTADA: 'bg-red-500', REPROGRAMADA: 'bg-blue-500', SIN_RESULTADO: 'bg-gray-400' }[k];
              return (
                <li key={k}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-700">{nombre}</span>
                    <span className="font-semibold text-gray-800">{n} <span className="font-normal text-gray-500">({pct}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden bg-gray-100 rounded-full">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-gray-500">Publicadas hoy: <span className="font-semibold text-gray-700">{r?.publicadas_hoy ?? 0}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/precargar', icon: 'upload', titulo: 'Precargar', texto: 'Cargar Excel y publicar', destacado: true },
            { to: '/resultados', icon: 'clipboard', titulo: 'Resultados', texto: 'Exportar y cargar el Excel diligenciado' },
            { to: '/historico', icon: 'calendar', titulo: 'Histórico', texto: 'Consultar OS publicadas' },
            { to: '/reportes', icon: 'barChart', titulo: 'Reportes', texto: 'Cumplimiento por técnico y municipio' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${a.destacado ? 'bg-brand-50 hover:bg-brand-100 border-brand-100' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
            >
              <Icon name={a.icon} className={`w-5 h-5 mt-0.5 ${a.destacado ? 'text-brand-600' : 'text-gray-600'}`} />
              <span>
                <span className={`block font-semibold mb-1 ${a.destacado ? 'text-brand-900' : 'text-gray-900'}`}>{a.titulo}</span>
                <span className={`block text-sm ${a.destacado ? 'text-brand-800' : 'text-gray-600'}`}>{a.texto}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
