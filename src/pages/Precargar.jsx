import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../api/client";
import Alerta from "../components/Alerta";
import { InsertarBadge, TecnicoBadge, ValidacionBadge } from "../components/Badges";
import Confirmar from "../components/Confirmar";
import DetalleOS from "../components/DetalleOS";
import Icon from "../components/Icon";
import SelectTecnico from "../components/SelectTecnico";
import { btn, input, label, spinner, tarjeta, td, th } from "../components/ui";
import useMensaje from "../hooks/useMensaje";
import {
    descargarDataUrl,
    esInsertar,
    esPublicable,
    fetchProgramaciones,
    formatFecha,
    formatFechaHora,
    validarExcel,
} from "../utils/programaciones";

const COLUMNAS = [
    "Número OS",
    "Nombre",
    "Municipio",
    "Técnico",
    "Asignado A",
    "F. Est. Resol",
    "Cargada",
    "Insertar",
    "Validación",
    "Acciones",
];

const FILTROS_VACIOS = { fechaInicio: "", fechaFin: "", tecnico_id: "", q: "" };

/** Texto de las omitidas del backend: hasta 5 "OS X: motivo". */
const resumenOmitidas = (omitidas = []) => {
    if (!omitidas.length) return "";
    const lineas = omitidas.slice(0, 5).map((o) => `OS ${o.numero_os ?? o.id}: ${o.motivo}`);
    const resto = omitidas.length > 5 ? ` y ${omitidas.length - 5} más` : "";
    return ` — ${lineas.join("; ")}${resto}`;
};

const Precargar = () => {
    const [programaciones, setProgramaciones] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [busy, setBusy] = useState(""); // "", "plantilla", "excel", "publicar", "eliminar"
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);
    const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [detalleId, setDetalleId] = useState(null);
    const [detalleModo, setDetalleModo] = useState("");
    const [huboCambios, setHuboCambios] = useState(false);
    const { mensaje, mostrar } = useMensaje();

    const rangoInvalido = Boolean(filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin);

    const cargarProgramaciones = useCallback(
        async (f = filtrosAplicados) => {
            setLoadingList(true);
            try {
                const lista = await fetchProgramaciones({ validacion: "PENDIENTE", ...f });
                setProgramaciones(lista);
                // Descartar selecciones que ya no están en la lista.
                setSelectedIds((prev) => prev.filter((id) => lista.some((p) => p.id === id)));
            } catch (error) {
                mostrar("error", `Error al cargar programaciones: ${error.message}`);
            } finally {
                setLoadingList(false);
            }
        },
        [filtrosAplicados, mostrar],
    );

    useEffect(() => {
        cargarProgramaciones();
    }, [cargarProgramaciones]);

    const handleBuscar = (e) => {
        e.preventDefault();
        if (rangoInvalido) return;
        setFiltrosAplicados({ ...filtros });
    };

    const handleLimpiar = () => {
        setFiltros(FILTROS_VACIOS);
        setFiltrosAplicados(FILTROS_VACIOS);
    };

    const handleDescargarPlantilla = async () => {
        setBusy("plantilla");
        try {
            descargarDataUrl(await apiFetch("/programaciones/descargar-plantilla"), "plantilla_programaciones.xlsx");
            mostrar("success", "Plantilla descargada correctamente");
        } catch (error) {
            mostrar("error", `Error al descargar plantilla: ${error.message}`);
        } finally {
            setBusy("");
        }
    };

    const handleCargarExcel = async (e) => {
        const input = e.target;
        const file = input.files[0];
        if (!file) return;

        const invalido = validarExcel(file);
        if (invalido) {
            mostrar("error", invalido);
            input.value = "";
            return;
        }

        setBusy("excel");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const data = await apiFetch("/programaciones/cargar-excel", { method: "POST", body: formData });
            const partes = [`${data.total} filas`, `${data.nuevas} nuevas`];
            if (data.duplicados) partes.push(`${data.duplicados} duplicadas`);
            if (data.sin_tecnico) partes.push(`${data.sin_tecnico} sin técnico`);
            mostrar(data.duplicados || data.sin_tecnico ? "warning" : "success", `Excel cargado: ${partes.join(", ")}`);
            await cargarProgramaciones();
        } catch (error) {
            mostrar("error", `Error al cargar Excel: ${error.message}`);
        } finally {
            setBusy("");
            input.value = ""; // permite volver a elegir el mismo archivo
        }
    };

    const publicables = useMemo(() => programaciones.filter(esPublicable), [programaciones]);
    const duplicadas = useMemo(() => programaciones.filter((p) => !esInsertar(p.insertar)).length, [programaciones]);
    const sinTecnico = useMemo(() => programaciones.filter((p) => esInsertar(p.insertar) && !p.tecnico_id).length, [programaciones]);
    const seleccionPublicable = useMemo(
        () => selectedIds.filter((id) => publicables.some((p) => p.id === id)),
        [selectedIds, publicables],
    );
    const todasPublicablesSeleccionadas = publicables.length > 0 && publicables.every((p) => selectedIds.includes(p.id));

    // "Seleccionar todos" solo marca las publicables; si ya están todas, las quita (deja el resto como estaba).
    const handleSelectAll = () => {
        setSelectedIds((prev) =>
            todasPublicablesSeleccionadas
                ? prev.filter((id) => !publicables.some((p) => p.id === id))
                : [...new Set([...prev, ...publicables.map((p) => p.id)])],
        );
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
    };

    const handlePublicar = async () => {
        if (seleccionPublicable.length === 0) {
            mostrar("error", "Ninguna de las seleccionadas se puede publicar (duplicada o sin técnico)");
            return;
        }
        setBusy("publicar");
        try {
            const data = await apiFetch("/programaciones/publicar", { method: "POST", body: { ids: seleccionPublicable } });
            const omitidas = data?.omitidas ?? [];
            const noEnviadas = selectedIds.length - seleccionPublicable.length;
            const extra = noEnviadas > 0 ? ` (${noEnviadas} seleccionada${noEnviadas === 1 ? "" : "s"} no publicable${noEnviadas === 1 ? "" : "s"} no se envió)` : "";
            mostrar(omitidas.length || noEnviadas ? "warning" : "success", `${data?.message || "Programaciones publicadas"}${extra}${resumenOmitidas(omitidas)}`);
            setSelectedIds([]);
            await cargarProgramaciones();
        } catch (error) {
            mostrar("error", `${error.message}${resumenOmitidas(error.detalles)}`);
        } finally {
            setBusy("");
        }
    };

    const handleEliminar = async () => {
        setBusy("eliminar");
        try {
            const data = await apiFetch("/programaciones/eliminar", { method: "POST", body: { ids: selectedIds } });
            const omitidas = data?.omitidas ?? [];
            mostrar(omitidas.length ? "warning" : "success", `${data?.message || "Programaciones eliminadas"}${resumenOmitidas(omitidas)}`);
            setSelectedIds([]);
            setConfirmarEliminar(false);
            await cargarProgramaciones();
        } catch (error) {
            mostrar("error", `Error al eliminar: ${error.message}${resumenOmitidas(error.detalles)}`);
        } finally {
            setBusy("");
        }
    };

    const cerrarDetalle = () => {
        setDetalleId(null);
        setDetalleModo("");
        if (huboCambios) {
            setHuboCambios(false);
            cargarProgramaciones();
        }
    };

    const isBusy = busy !== "";
    const campoFiltro = (name) => ({
        name,
        value: filtros[name],
        onChange: (e) => setFiltros((f) => ({ ...f, [name]: e.target.value })),
        className: input,
    });

    return (
        <>
            <div className="mb-6">
                <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Precargar Programación</h1>
                <p className="text-gray-600">Carga y gestiona programaciones antes de publicar</p>
            </div>

            <Alerta mensaje={mensaje} />

            <div className={`${tarjeta} mb-6`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button type="button" onClick={handleDescargarPlantilla} disabled={isBusy} className={btn.secundario}>
                        <Icon name="download" className="w-4 h-4" />
                        {busy === "plantilla" ? "Descargando..." : "Descargar Plantilla"}
                    </button>

                    <label className={`${btn.oscuro} focus-within:ring-2 focus-within:ring-brand-500/50 ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <Icon name="upload" className="w-4 h-4" />
                        {busy === "excel" ? "Cargando..." : "Cargar Excel"}
                        <input type="file" accept=".xlsx" onChange={handleCargarExcel} disabled={isBusy} className="sr-only" />
                    </label>

                    <button type="button" onClick={handleSelectAll} disabled={publicables.length === 0 || isBusy} className={btn.secundario}>
                        <Icon name="checkSquare" className="w-4 h-4" />
                        {todasPublicablesSeleccionadas ? "Deseleccionar publicables" : "Seleccionar publicables"}
                    </button>

                    <div className="flex gap-3 sm:ml-auto">
                        <button
                            type="button"
                            onClick={() => setConfirmarEliminar(true)}
                            disabled={selectedIds.length === 0 || isBusy}
                            className={`${btn.secundario} text-red-600! border-red-200 hover:bg-red-50`}>
                            <Icon name="trash" className="w-4 h-4" />
                            Eliminar ({selectedIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={handlePublicar}
                            disabled={seleccionPublicable.length === 0 || isBusy}
                            title={selectedIds.length && !seleccionPublicable.length ? "Ninguna de las seleccionadas se puede publicar" : undefined}
                            className={btn.primario}>
                            <Icon name="send" className="w-4 h-4" />
                            {busy === "publicar" ? "Publicando..." : `Publicar (${seleccionPublicable.length})`}
                        </button>
                    </div>
                </div>

                <form className="grid grid-cols-1 gap-3 pt-4 mt-4 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleBuscar}>
                    <div>
                        <label htmlFor="fechaInicio" className={label}>Cargada desde</label>
                        <input id="fechaInicio" type="date" max={filtros.fechaFin || undefined} {...campoFiltro("fechaInicio")} />
                    </div>
                    <div>
                        <label htmlFor="fechaFin" className={label}>Cargada hasta</label>
                        <input id="fechaFin" type="date" min={filtros.fechaInicio || undefined} {...campoFiltro("fechaFin")} />
                    </div>
                    <div>
                        <label htmlFor="tecnico" className={label}>Técnico</label>
                        <SelectTecnico
                            id="tecnico"
                            value={filtros.tecnico_id}
                            onChange={(v) => setFiltros((f) => ({ ...f, tecnico_id: v }))}
                            opcionTodos
                            opcionSin
                        />
                    </div>
                    <div>
                        <label htmlFor="q" className={label}>Buscar</label>
                        <input id="q" type="search" placeholder="OS, NIC, nombre, dirección..." {...campoFiltro("q")} />
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" disabled={loadingList || rangoInvalido} className={`${btn.primario} flex-1`}>
                            <Icon name="search" className="w-4 h-4" /> Buscar
                        </button>
                        <button type="button" onClick={handleLimpiar} disabled={loadingList} className={btn.secundario}>
                            Limpiar
                        </button>
                    </div>
                </form>
                {rangoInvalido && <p className="mt-2 text-sm text-red-600">La fecha inicial no puede ser mayor que la fecha final.</p>}

                {(duplicadas > 0 || sinTecnico > 0) && (
                    <p className="flex items-start gap-2 mt-3 text-sm text-yellow-800">
                        <Icon name="alert" className="w-4 h-4 mt-0.5" />
                        <span>
                            {duplicadas > 0 && `${duplicadas} duplicada${duplicadas === 1 ? "" : "s"} (histórico, no se publican)`}
                            {duplicadas > 0 && sinTecnico > 0 && " · "}
                            {sinTecnico > 0 && `${sinTecnico} sin técnico (asígnalo para poder publicar)`}
                        </span>
                    </p>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
                {loadingList ? (
                    <div className="flex items-center justify-center py-12">
                        <div className={spinner}></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            aria-label="Seleccionar todas las publicables"
                                            checked={todasPublicablesSeleccionadas}
                                            disabled={publicables.length === 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 cursor-pointer accent-brand-600"
                                        />
                                    </th>
                                    {COLUMNAS.map((columna) => (
                                        <th key={columna} className={th}>
                                            {columna}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {programaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLUMNAS.length + 1} className="px-4 py-8 text-center text-gray-500">
                                            {filtrosAplicados !== FILTROS_VACIOS && Object.values(filtrosAplicados).some(Boolean)
                                                ? "No hay programaciones pendientes con esos filtros."
                                                : "No hay programaciones precargadas. Carga un archivo Excel para comenzar."}
                                        </td>
                                    </tr>
                                ) : (
                                    programaciones.map((prog) => {
                                        const duplicada = !esInsertar(prog.insertar);
                                        const faltaTecnico = !duplicada && !prog.tecnico_id;
                                        const publicable = esPublicable(prog);
                                        const fondo = duplicada ? "bg-red-50/50" : faltaTecnico ? "bg-amber-50/60" : "hover:bg-gray-50";
                                        const motivo = duplicada
                                            ? "OS duplicada: no se puede publicar (sí se puede eliminar)"
                                            : faltaTecnico
                                              ? "Sin técnico asignado: asígnalo para poder publicar (sí se puede eliminar)"
                                              : undefined;
                                        return (
                                            <tr key={prog.id} className={fondo}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Seleccionar OS ${prog.numero_os}`}
                                                        title={motivo}
                                                        checked={selectedIds.includes(prog.id)}
                                                        onChange={() => handleSelectOne(prog.id)}
                                                        className={`w-4 h-4 cursor-pointer ${publicable ? "accent-brand-600" : "accent-gray-500"}`}
                                                    />
                                                </td>
                                                <td className={`${td} font-medium text-gray-900`}>{prog.numero_os}</td>
                                                <td className={td}>{prog.nombre || "—"}</td>
                                                <td className={td}>{prog.municipio || "—"}</td>
                                                <td className={td}>
                                                    <TecnicoBadge programacion={prog} />
                                                </td>
                                                <td className={`${td} text-gray-400`}>{prog.asignado_a || "—"}</td>
                                                <td className={td}>{formatFecha(prog.fecha_estimada_resolucion)}</td>
                                                <td className={td}>{formatFechaHora(prog.fecha_creacion)}</td>
                                                <td className={td}>
                                                    <InsertarBadge value={prog.insertar} />
                                                </td>
                                                <td className={td}>
                                                    <ValidacionBadge value={prog.validacion} />
                                                </td>
                                                <td className={td}>
                                                    <div className="flex items-center gap-1">
                                                        {!duplicada && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDetalleModo("tecnico");
                                                                    setDetalleId(prog.id);
                                                                }}
                                                                title={prog.tecnico_id ? "Cambiar técnico" : "Asignar técnico"}
                                                                aria-label={`Asignar técnico a OS ${prog.numero_os}`}
                                                                className={`${btn.icono} ${faltaTecnico ? "text-amber-600" : ""}`}>
                                                                <Icon name="userCheck" className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetalleId(prog.id)}
                                                            title="Ver detalle"
                                                            aria-label={`Ver detalle de OS ${prog.numero_os}`}
                                                            className={btn.icono}>
                                                            <Icon name="eye" className="w-4 h-4" />
                                                        </button>
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

            {!loadingList && programaciones.length > 0 && (
                <div className="mt-4 text-sm text-center text-gray-600">
                    {programaciones.length} pendiente{programaciones.length === 1 ? "" : "s"} · {publicables.length} publicable
                    {publicables.length === 1 ? "" : "s"} · {selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"}
                </div>
            )}

            <Confirmar
                open={confirmarEliminar}
                onClose={() => setConfirmarEliminar(false)}
                onConfirm={handleEliminar}
                title="Eliminar programaciones"
                confirmText="Eliminar"
                peligro
                busy={busy === "eliminar"}>
                Se eliminarán <strong>{selectedIds.length}</strong> programación{selectedIds.length === 1 ? "" : "es"} pendiente
                {selectedIds.length === 1 ? "" : "s"} de la precarga. Esta acción no se puede deshacer.
            </Confirmar>

            <DetalleOS id={detalleId} open={detalleId !== null} modoInicial={detalleModo} onClose={cerrarDetalle} onChange={() => setHuboCambios(true)} />
        </>
    );
};

export default Precargar;
