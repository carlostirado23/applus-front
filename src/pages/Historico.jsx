import { useState, useEffect, useMemo } from "react";
import { InsertarBadge, ValidacionBadge } from "../components/Badges";
import Icon from "../components/Icon";
import {
    fetchProgramaciones,
    finDelDia,
    formatFecha,
    formatFechaHora,
    inicioDelDia,
    parseFecha,
    tieneValidacion,
} from "../utils/programaciones";

const COLUMNAS = [
    "Número OS",
    "Nombre",
    "Municipio",
    "Formulario",
    "Creado Por",
    "Asignado A",
    "F. Est. Resol",
    "Fecha de carga",
    "Insertar",
    "Validación",
];

const Historico = () => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    // Rango ya consultado al servidor; el filtro local usa este, no lo que se está escribiendo.
    const [rango, setRango] = useState({ fechaInicio: "", fechaFin: "" });

    const rangoInvalido = Boolean(fechaInicio && fechaFin && fechaInicio > fechaFin);

    const cargarHistorico = async (filtros = {}) => {
        setLoading(true);
        setError("");
        try {
            const lista = await fetchProgramaciones(filtros);
            setHistorico(lista.filter((p) => tieneValidacion(p, "PUBLICADO")));
            setRango({ fechaInicio: filtros.fechaInicio || "", fechaFin: filtros.fechaFin || "" });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorico();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rangoInvalido) return;
        cargarHistorico({ fechaInicio, fechaFin });
    };

    const handleLimpiar = () => {
        setSearchTerm("");
        setFechaInicio("");
        setFechaFin("");
        cargarHistorico();
    };

    const filteredHistorico = useMemo(() => {
        const texto = searchTerm.trim().toLowerCase();
        // El backend ya filtra por el rango exacto; este recorte local solo cubre datos ya cargados sin refrescar.
        const desde = inicioDelDia(rango.fechaInicio);
        const hasta = finDelDia(rango.fechaFin);

        return historico.filter((item) => {
            const matchTexto =
                !texto ||
                [item.numero_os, item.nombre, item.municipio, item.formulario, item.asignado_a, item.creado_por].some((campo) =>
                    String(campo ?? "").toLowerCase().includes(texto),
                );
            if (!matchTexto) return false;

            if (!desde && !hasta) return true;
            const fecha = parseFecha(item.fecha_creacion);
            if (!fecha) return false;
            return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
        });
    }, [historico, searchTerm, rango]);

    const hayFiltros = Boolean(searchTerm || rango.fechaInicio || rango.fechaFin);
    const inputFecha =
        "w-full px-4 py-2 font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500";

    return (
        <>
            <div className="mb-6">
                <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Histórico de Programaciones</h1>
                <p className="text-gray-600">Consulta todas las programaciones publicadas</p>
            </div>

            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50" role="alert">
                    Error al cargar el histórico: {error}
                </div>
            )}

            <div className="p-4 mb-6 bg-white shadow-md rounded-xl sm:p-6">
                <form className="flex flex-col w-full gap-2 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
                    <div className="flex flex-col items-start w-full sm:w-1/4">
                        <label htmlFor="fechaInicio" className="mb-1 text-xs font-semibold text-gray-700">
                            Cargado desde
                        </label>
                        <input
                            id="fechaInicio"
                            type="date"
                            value={fechaInicio}
                            max={fechaFin || undefined}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={inputFecha}
                        />
                    </div>
                    <span className="hidden mx-2 mb-2 font-bold text-gray-500 sm:inline-block">a</span>
                    <div className="flex flex-col items-start w-full sm:w-1/4">
                        <label htmlFor="fechaFin" className="mb-1 text-xs font-semibold text-gray-700">
                            Cargado hasta
                        </label>
                        <input
                            id="fechaFin"
                            type="date"
                            value={fechaFin}
                            min={fechaInicio || undefined}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={inputFecha}
                        />
                    </div>
                    <div className="flex flex-col items-start w-full sm:w-2/5 sm:ml-4">
                        <label htmlFor="searchTerm" className="mb-1 text-xs font-semibold text-gray-700">
                            Buscar
                        </label>
                        <input
                            id="searchTerm"
                            type="search"
                            placeholder="Buscar por OS, nombre, municipio, formulario, creador o asignado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || rangoInvalido}
                        className="flex items-center justify-center w-full px-6 py-2 mt-2 font-semibold text-white transition-colors bg-brand-600 rounded-lg cursor-pointer sm:w-auto hover:bg-brand-700 sm:mt-0 sm:ml-4 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Icon name="search" className="w-4 h-4 mr-2" /> Buscar
                    </button>
                    {hayFiltros && (
                        <button
                            type="button"
                            onClick={handleLimpiar}
                            className="w-full px-4 py-2 mt-2 font-semibold text-gray-700 transition-colors bg-gray-200 rounded-lg cursor-pointer sm:w-auto hover:bg-gray-300 sm:mt-0">
                            Limpiar
                        </button>
                    )}
                </form>
                {rangoInvalido && (
                    <p className="mt-2 text-sm text-red-600">La fecha inicial no puede ser mayor que la fecha final.</p>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {COLUMNAS.map((columna) => (
                                        <th
                                            key={columna}
                                            className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            {columna}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredHistorico.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLUMNAS.length} className="px-4 py-8 text-center text-gray-500">
                                            {hayFiltros
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
                                                {item.nombre || "—"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {item.municipio || "—"}
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
                                                {formatFecha(item.fecha_estimada_resolucion)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {formatFechaHora(item.fecha_creacion)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <InsertarBadge value={item.insertar} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <ValidacionBadge value={item.validacion} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && filteredHistorico.length > 0 && (
                <div className="mt-4 text-sm text-center text-gray-600">
                    Mostrando {filteredHistorico.length} de {historico.length} programaciones
                </div>
            )}
        </>
    );
};

export default Historico;
