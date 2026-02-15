import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const Historico = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const { getToken } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchHistorico();
        // eslint-disable-next-line
    }, []);

    const fetchHistorico = async (fechaIni = undefined, fechaFin = undefined) => {
        setLoading(true);
        try {
            let url = `${API_URL}/programaciones/`;
            const params = [];
            // Formatear fechas para cubrir todo el día
            let fechaIniFull = fechaIni ? `${fechaIni} 00:00:00` : undefined;
            let fechaFinFull = fechaFin ? `${fechaFin} 23:59:59` : undefined;
            if (fechaIniFull) params.push(`fecha_inicial=${encodeURIComponent(fechaIniFull)}`);
            if (fechaFinFull) params.push(`fecha_final=${encodeURIComponent(fechaFinFull)}`);
            if (params.length) url += `?${params.join("&")}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Usar el array plano y filtrar solo las programaciones con validación PUBLICADO
                const all = data.programaciones || data.historico || data || [];
                setHistorico(Array.isArray(all) ? all.filter((p) => p.validacion && p.validacion.toUpperCase() === "PUBLICADO") : []);
            }
        } catch (error) {
            console.error("Error al cargar histórico:", error);
        }
        setLoading(false);
    };

    const filteredHistorico = historico.filter((item) => {
        // Filtro por texto
        const texto = searchTerm.toLowerCase();
        const matchTexto =
            item.numero_os?.toString().toLowerCase().includes(texto) ||
            item.formulario?.toLowerCase().includes(texto) ||
            item.asignado_a?.toLowerCase().includes(texto);

        // Filtro por fecha
        let matchFecha = true;
        if (fechaInicio) {
            matchFecha =
                matchFecha &&
                item.fecha_estimada_resolucion &&
                new Date(item.fecha_estimada_resolucion) >= new Date(fechaInicio);
        }
        if (fechaFin) {
            matchFecha =
                matchFecha &&
                item.fecha_estimada_resolucion &&
                new Date(item.fecha_estimada_resolucion) <= new Date(fechaFin);
        }

        return matchTexto && matchFecha;
    });

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-col flex-1 lg:ml-64">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-4 overflow-y-auto sm:p-6 lg:p-8">
                    <div className="mb-6">
                        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                            Histórico de Programaciones
                        </h1>
                        <p className="text-gray-600">Consulta todas las programaciones publicadas</p>
                    </div>

                    <div className="p-4 mb-6 bg-white shadow-md rounded-xl sm:p-6">
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <form
                                className="flex flex-col w-full gap-2 sm:flex-row sm:items-end"
                                onSubmit={e => { e.preventDefault(); fetchHistorico(fechaInicio, fechaFin); }}
                            >
                                <div className="flex flex-col w-full gap-2 sm:flex-row">
                                    <div className="flex flex-col items-start w-full sm:w-1/4">
                                        <label htmlFor="fechaInicio" className="mb-1 text-xs font-semibold text-gray-700">Fecha inicial</label>
                                        <input
                                            id="fechaInicio"
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="w-full px-4 py-2 font-medium text-gray-800 transition-all bg-white border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                                        />
                                    </div>
                                    <span className="hidden mx-2 font-bold text-gray-500 sm:inline-block mt-7">a</span>
                                    <div className="flex flex-col items-start w-full sm:w-1/4">
                                        <label htmlFor="fechaFin" className="mb-1 text-xs font-semibold text-gray-700">Fecha final</label>
                                        <input
                                            id="fechaFin"
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            className="w-full px-4 py-2 font-medium text-gray-800 transition-all bg-white border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-col items-start w-full sm:w-2/5 sm:ml-4">
                                        <label htmlFor="searchTerm" className="mb-1 text-xs font-semibold text-gray-700">Buscar</label>
                                        <input
                                            id="searchTerm"
                                            type="text"
                                            placeholder="Buscar por OS, formulario o asignado..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center w-full px-6 py-2 mt-2 font-semibold text-white transition-colors bg-blue-500 rounded-lg sm:w-auto hover:bg-blue-600 sm:mt-0 sm:ml-4"
                                    >
                                        <span className="mr-2">🔍</span> Buscar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-md rounded-xl">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Número OS
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Formulario
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Creado Por
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Asignado A
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                F. Est. Resol
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Insertar
                                            </th>
                                            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Validación
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredHistorico.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                    {searchTerm
                                                        ? "No se encontraron resultados para tu búsqueda."
                                                        : "No hay programaciones publicadas aún."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistorico.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                        {item.numero_os}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {item.formulario}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {item.creado_por}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {item.asignado_a}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {item.fecha_estimada_resolucion
                                                            ? new Date(
                                                                  item.fecha_estimada_resolucion,
                                                              ).toLocaleDateString("es-ES")
                                                            : "—"}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${item.insertar === true || item.insertar === "SI" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {item.insertar === true || item.insertar === "SI"
                                                                ? "SI"
                                                                : "NO"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${item.validacion === "OK" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                                            {item.validacion}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {filteredHistorico.length > 0 && (
                        <div className="mt-4 text-sm text-center text-gray-600">
                            Mostrando {filteredHistorico.length} de {historico.length} programaciones
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Historico;
