import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiDownload, query } from "../api/client";
import Alerta from "../components/Alerta";
import { EstadoEjecucionBadge, TecnicoBadge } from "../components/Badges";
import DetalleOS from "../components/DetalleOS";
import Icon from "../components/Icon";
import Paginacion from "../components/Paginacion";
import SelectTecnico from "../components/SelectTecnico";
import { btn, input, label, spinner, tarjeta, td, th } from "../components/ui";
import useMensaje from "../hooks/useMensaje";
import {
    ESTADOS_EJECUCION,
    fetchProgramaciones,
    formatFecha,
    formatFechaHora,
    paramsProgramaciones,
} from "../utils/programaciones";

const COLUMNAS = ["Número OS", "Nombre", "Municipio", "Técnico", "F. Est. Resol", "Publicada", "Vista", "Estado", "Acciones"];

const CAMPOS_FECHA = [
    { value: "fecha_creacion", label: "Fecha de carga" },
    { value: "fecha_publicacion", label: "Fecha de publicación" },
    { value: "fecha_estimada_resolucion", label: "Fecha estimada" },
];

const LIMITE = 25;

const FILTROS_VACIOS = {
    fechaInicio: "",
    fechaFin: "",
    campoFecha: "fecha_creacion",
    tecnico_id: "",
    municipio: "",
    estado_ejecucion: "",
    q: "",
};

/** Filtros iniciales: si vienen del dashboard (?tecnico_id&fecha) se preseleccionan. */
const filtrosDesdeUrl = (params) => {
    const tecnico_id = params.get("tecnico_id") || "";
    const fecha = params.get("fecha") || "";
    if (!tecnico_id && !fecha) return FILTROS_VACIOS;
    return {
        ...FILTROS_VACIOS,
        tecnico_id,
        fechaInicio: fecha,
        fechaFin: fecha,
        campoFecha: fecha ? "fecha_estimada_resolucion" : FILTROS_VACIOS.campoFecha,
    };
};

const Historico = () => {
    const [searchParams] = useSearchParams();
    const [filtros, setFiltros] = useState(() => filtrosDesdeUrl(searchParams));
    // Filtros ya consultados al servidor; la paginación usa estos, no lo que se está escribiendo.
    const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);
    const [page, setPage] = useState(1);
    const [resultado, setResultado] = useState({ data: [], total: 0, page: 1, limit: LIMITE, paginas: 1 });
    const [loading, setLoading] = useState(true);
    const [exportando, setExportando] = useState(false);
    const [detalleId, setDetalleId] = useState(null);
    const [huboCambios, setHuboCambios] = useState(false);
    const { mensaje, mostrar } = useMensaje();

    const rangoInvalido = Boolean(filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            setResultado(await fetchProgramaciones({ validacion: "PUBLICADO", ...filtrosAplicados, page, limit: LIMITE }));
        } catch (err) {
            mostrar("error", `Error al cargar el histórico: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [filtrosAplicados, page, mostrar]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rangoInvalido) return;
        setPage(1);
        setFiltrosAplicados({ ...filtros });
    };

    const handleLimpiar = () => {
        setFiltros(FILTROS_VACIOS);
        setFiltrosAplicados(FILTROS_VACIOS);
        setPage(1);
    };

    const handleExportar = async () => {
        setExportando(true);
        try {
            const nombre = await apiDownload(
                `/programaciones/exportar${query(paramsProgramaciones({ validacion: "PUBLICADO", ...filtrosAplicados }))}`,
                "programaciones.xlsx",
            );
            mostrar("success", `Archivo ${nombre} descargado`);
        } catch (err) {
            mostrar("error", `Error al exportar: ${err.message}`);
        } finally {
            setExportando(false);
        }
    };

    const cerrarDetalle = () => {
        setDetalleId(null);
        if (huboCambios) {
            setHuboCambios(false);
            cargar();
        }
    };

    const hayFiltros = Object.keys(FILTROS_VACIOS).some((k) => filtrosAplicados[k] !== FILTROS_VACIOS[k]);
    const campo = (name) => ({
        id: name,
        name,
        value: filtros[name],
        onChange: (e) => setFiltros((f) => ({ ...f, [name]: e.target.value })),
        className: input,
    });

    return (
        <>
            <div className="mb-6">
                <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Histórico de Programaciones</h1>
                <p className="text-gray-600">Consulta todas las programaciones publicadas</p>
            </div>

            <Alerta mensaje={mensaje} />

            <div className={`${tarjeta} mb-6`}>
                <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="campoFecha" className={label}>Filtrar fecha por</label>
                        <select {...campo("campoFecha")}>
                            {CAMPOS_FECHA.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="fechaInicio" className={label}>Desde</label>
                        <input type="date" max={filtros.fechaFin || undefined} {...campo("fechaInicio")} />
                    </div>
                    <div>
                        <label htmlFor="fechaFin" className={label}>Hasta</label>
                        <input type="date" min={filtros.fechaInicio || undefined} {...campo("fechaFin")} />
                    </div>
                    <div>
                        <label htmlFor="tecnico_id" className={label}>Técnico</label>
                        <SelectTecnico
                            id="tecnico_id"
                            value={filtros.tecnico_id}
                            onChange={(v) => setFiltros((f) => ({ ...f, tecnico_id: v }))}
                            opcionTodos
                        />
                    </div>
                    <div>
                        <label htmlFor="municipio" className={label}>Municipio</label>
                        <input type="text" placeholder="Ej: Montería" {...campo("municipio")} />
                    </div>
                    <div>
                        <label htmlFor="estado_ejecucion" className={label}>Estado de ejecución</label>
                        <select {...campo("estado_ejecucion")}>
                            <option value="">Todos</option>
                            {Object.entries(ESTADOS_EJECUCION).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="q" className={label}>Buscar</label>
                        <input type="search" placeholder="OS, NIC, nombre, dirección, técnico..." {...campo("q")} />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                        <button type="submit" disabled={loading || rangoInvalido} className={btn.primario}>
                            <Icon name="search" className="w-4 h-4" /> Buscar
                        </button>
                        {hayFiltros && (
                            <button type="button" onClick={handleLimpiar} disabled={loading} className={btn.secundario}>
                                Limpiar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleExportar}
                            disabled={exportando || loading || resultado.total === 0}
                            className={`${btn.secundario} sm:ml-auto`}>
                            <Icon name="download" className="w-4 h-4" />
                            {exportando ? "Exportando..." : "Exportar Excel"}
                        </button>
                    </div>
                </form>
                {rangoInvalido && (
                    <p className="mt-2 text-sm text-red-600">La fecha inicial no puede ser mayor que la fecha final.</p>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className={spinner}></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {COLUMNAS.map((columna) => (
                                            <th key={columna} className={th}>
                                                {columna}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {resultado.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLUMNAS.length} className="px-4 py-8 text-center text-gray-500">
                                                {hayFiltros
                                                    ? "No se encontraron resultados para tu búsqueda."
                                                    : "No hay programaciones publicadas aún."}
                                            </td>
                                        </tr>
                                    ) : (
                                        resultado.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className={`${td} font-medium text-gray-900`}>{item.numero_os}</td>
                                                <td className={td}>{item.nombre || "—"}</td>
                                                <td className={td}>{item.municipio || "—"}</td>
                                                <td className={td}>
                                                    <TecnicoBadge programacion={item} />
                                                </td>
                                                <td className={td}>{formatFecha(item.fecha_estimada_resolucion)}</td>
                                                <td className={td}>{formatFechaHora(item.fecha_publicacion)}</td>
                                                <td className={td}>
                                                    {item.fecha_vista ? (
                                                        <span
                                                            className="inline-flex text-green-600"
                                                            title={`Vista el ${formatFechaHora(item.fecha_vista)}`}
                                                            aria-label="Vista por el técnico">
                                                            <Icon name="check" className="w-5 h-5" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400" title="El técnico aún no la ha visto">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={td}>
                                                    <EstadoEjecucionBadge value={item.estado_ejecucion} />
                                                </td>
                                                <td className={td}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetalleId(item.id)}
                                                        title="Ver detalle"
                                                        aria-label={`Ver detalle de OS ${item.numero_os}`}
                                                        className={btn.icono}>
                                                        <Icon name="eye" className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Paginacion
                            page={resultado.page}
                            paginas={resultado.paginas}
                            total={resultado.total}
                            limit={resultado.limit}
                            onChange={setPage}
                            disabled={loading}
                        />
                    </>
                )}
            </div>

            <DetalleOS id={detalleId} open={detalleId !== null} onClose={cerrarDetalle} onChange={() => setHuboCambios(true)} />
        </>
    );
};

export default Historico;
