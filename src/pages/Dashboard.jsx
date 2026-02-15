import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { title: 'Total Programaciones', value: '156', color: 'bg-blue-500', icon: '📊' },
    { title: 'Precargadas', value: '24', color: 'bg-yellow-500', icon: '⏳' },
    { title: 'Publicadas', value: '132', color: 'bg-green-500', icon: '✅' },
    { title: 'Pendientes', value: '8', color: 'bg-red-500', icon: '⚠️' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Vista general del sistema administrativo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
              <div className="space-y-4">
                {[
                  { action: 'Nueva programación publicada', time: 'Hace 5 minutos', type: 'success' },
                  { action: 'Excel cargado correctamente', time: 'Hace 1 hora', type: 'info' },
                  { action: 'Validación completada', time: 'Hace 2 horas', type: 'success' },
                  { action: 'Error en carga de datos', time: 'Hace 3 horas', type: 'error' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'success'
                          ? 'bg-green-500'
                          : activity.type === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium text-sm">{activity.action}</p>
                      <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
              <div className="space-y-3">
                <a
                  href="/precargar"
                  className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-blue-900 mb-1">Precargar Programación</h3>
                  <p className="text-sm text-blue-700">Cargar nuevos datos desde Excel</p>
                </a>
                <a
                  href="/historico"
                  className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-green-900 mb-1">Ver Histórico</h3>
                  <p className="text-sm text-green-700">Consultar programaciones publicadas</p>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
