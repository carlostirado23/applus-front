import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { esInsertar, fetchProgramaciones, tieneValidacion } from '../utils/programaciones';

const Dashboard = () => {
  const [programaciones, setProgramaciones] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    fetchProgramaciones()
      .then((lista) => activo && setProgramaciones(lista))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, []);

  const contar = (estado) =>
    programaciones ? programaciones.filter((p) => tieneValidacion(p, estado)).length : null;

  const stats = [
    { title: 'Total Programaciones', value: programaciones?.length ?? null, color: 'bg-brand-100 text-brand-600', icon: 'layers' },
    { title: 'Pendientes por publicar', value: contar('PENDIENTE'), color: 'bg-amber-100 text-amber-600', icon: 'clock' },
    { title: 'Publicadas', value: contar('PUBLICADO'), color: 'bg-green-100 text-green-600', icon: 'checkCircle' },
    {
      title: 'OS duplicadas',
      value: programaciones ? programaciones.filter((p) => !esInsertar(p.insertar)).length : null,
      color: 'bg-red-100 text-red-600',
      icon: 'alert',
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vista general del sistema administrativo</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          No se pudieron cargar las estadísticas: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <Icon name={stat.icon} className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-800">
              {stat.value ?? (error ? '—' : '…')}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/precargar"
            className="flex items-start gap-3 p-4 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-lg transition-colors"
          >
            <Icon name="upload" className="w-5 h-5 mt-0.5 text-brand-600" />
            <span>
              <span className="block font-semibold text-brand-900 mb-1">Precargar Programación</span>
              <span className="block text-sm text-brand-800">Cargar nuevos datos desde Excel</span>
            </span>
          </Link>
          <Link
            to="/historico"
            className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <Icon name="calendar" className="w-5 h-5 mt-0.5 text-gray-600" />
            <span>
              <span className="block font-semibold text-gray-900 mb-1">Ver Histórico</span>
              <span className="block text-sm text-gray-600">Consultar programaciones publicadas</span>
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
