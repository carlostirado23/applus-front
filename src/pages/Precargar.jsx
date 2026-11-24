import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiFetch } from "../api/client";
import { InsertarBadge, ValidacionBadge } from "../components/Badges";
import { esInsertar, fetchProgramaciones, formatFecha, tieneValidacion } from "../utils/programaciones";

const MAX_EXCEL_BYTES = 10 * 1024 * 1024; // límite del backend
const COLUMNAS = [
    "Número OS",
    "Nombre",
    "Municipio",
    "Formulario",
    "Creado Por",
    "Asignado A",
    "F. Est. Resol",
    "Insertar",
    "Validación",
];

// Solo se publican las OS nuevas (insertar = true). Las duplicadas quedan como histórico; el backend también las rechaza.
const esPublicable = (prog) => esInsertar(prog.insertar);

const Precargar = () => {
    const [programaciones, setProgramaciones] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [busy, setBusy] = useState(""); // "", "plantilla", "excel", "publicar"
    const [message, setMessage] = useState({ type: "", text: "" });
    const messageTimer = useRef(null);

    // Un solo temporizador: un mensaje nuevo no es borrado por el timeout del anterior.
    const showMessage = useCallback((type, text) => {
        clearTimeout(messageTimer.current);
        setMessage({ type, text });
        messageTimer.current = setTimeout(() => setMessage({ type: "", text: "" }), type === "success" ? 3000 : 6000);
    }, []);

    useEffect(() => () => clearTimeout(messageTimer.current), []);

    const cargarProgramaciones = useCallback(async () => {
        try {
            const lista = await fetchProgramaciones();
            const pendientes = lista.filter((p) => tieneValidacion(p, "PENDIENTE"));
            setProgramaciones(pendientes);
            // Descartar selecciones que ya no existen o ya no se pueden publicar.
            setSelectedIds((prev) => prev.filter((id) => pendientes.some((p) => p.id === id && esPublicable(p))));
        } catch (error) {
            showMessage("error", `Error al cargar programaciones: ${error.message}`);
        } finally {
            setLoadingList(false);
        }
    }, [showMessage]);

    useEffect(() => {
        cargarProgramaciones();
    }, [cargarProgramaciones]);

    const handleDescargarPlantilla = async () => {
        setBusy("plantilla");
        try {
            const data = await apiFetch("/programaciones/descargar-plantilla");
            if (!data?.dataUrl) throw new Error("No se recibió el archivo");

            const a = document.createElement("a");
            a.href = data.dataUrl;
            a.download = data.fileName || "plantilla_programaciones.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();

            showMessage("success", "Plantilla descargada correctamente");
        } catch (error) {
            showMessage("error", `Error al descargar plantilla: ${error.message}`);
        } finally {
            setBusy("");
        }
    };

    const handleCargarExcel = async (e) => {
        const input = e.target;
        const file = input.files[0];
        if (!file) return;

        // Mismas reglas que el backend: solo .xlsx, máximo 10 MB.
        if (!/\.xlsx$/i.test(file.name)) {
            showMessage("error", "Solo se aceptan archivos .xlsx");
            input.value = "";
            return;
        }
        if (file.size > MAX_EXCEL_BYTES) {
            showMessage("error", "El archivo supera el tamaño máximo permitido (10 MB)");
            input.value = "";
            return;
        }

        setBusy("excel");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const data = await apiFetch("/programaciones/cargar-excel", { method: "POST", body: formData });
            const resumen =
                data?.total != null
                    ? `: ${data.total} filas (${data.nuevas} nuevas, ${data.duplicados} duplicadas)`
                    : "";
            showMessage(data?.duplicados ? "warning" : "success", `Excel cargado correctamente${resumen}`);
            await cargarProgramaciones();
        } catch (error) {
            showMessage("error", `Error al cargar Excel: ${error.message}`);
        } finally {
            setBusy("");
            input.value = ""; // permite volver a elegir el mismo archivo
        }
    };

    const publicables = useMemo(() => programaciones.filter(esPublicable), [programaciones]);
    const duplicadas = programaciones.length - publicables.length;
    const allSelected = publicables.length > 0 && selectedIds.length === publicables.length;

    const handleSelectAll = () => {
        setSelectedIds(allSelected ? [] : publicables.map((p) => p.id));
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
    };

    const handlePublicar = async () => {
        if (selectedIds.length === 0) {
            showMessage("error", "Seleccione al menos una programación");
            return;
        }

        setBusy("publicar");
        try {
            const data = await apiFetch("/programaciones/publicar", { method: "POST", body: { ids: selectedIds } });
            const omitidas = data?.omitidas?.length ?? 0;
            showMessage(
                omitidas ? "warning" : "success",
                data?.message || `Programaciones publicadas correctamente (${data?.total ?? selectedIds.length})`,
            );
            setSelectedIds([]);
            await cargarProgramaciones();
        } catch (error) {
            showMessage("error", `Error al publicar programaciones: ${error.message}`);
        } finally {
            setBusy("");
        }
    };

    const isBusy = busy !== "";
    const boton =
        "flex-1 px-6 py-3 font-semibold text-white transition-colors rounded-lg cursor-pointer sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <>
            <div className="mb-6">
                <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Precargar Programación</h1>
                <p className="text-gray-600">Carga y gestiona programaciones antes de publicar</p>
            </div>

            {message.text && (
                <div
                    role={message.type === "error" ? "alert" : "status"}
                    className={`mb-4 p-4 rounded-lg ${
                        message.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : message.type === "warning"
                              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                              : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="p-4 mb-6 bg-white shadow-md rounded-xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <button
                        type="button"
                        onClick={handleDescargarPlantilla}
                        disabled={isBusy}
                        className={`${boton} bg-blue-500 hover:bg-blue-600`}>
                        📥 {busy === "plantilla" ? "Descargando..." : "Descargar Plantilla"}
                    </button>

                    <label
                        className={`flex-1 px-6 py-3 font-semibold text-center text-white transition-colors bg-green-500 rounded-lg sm:flex-none focus-within:ring-2 focus-within:ring-green-300 ${
                            isBusy ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green-600"
                        }`}>
                        📤 {busy === "excel" ? "Cargando..." : "Cargar Excel"}
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleCargarExcel}
                            disabled={isBusy}
                            className="sr-only"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={publicables.length === 0 || isBusy}
                        className={`${boton} bg-gray-500 hover:bg-gray-600`}>
                        {allSelected ? "☑️ Deseleccionar Todos" : "☑️ Seleccionar Todos"}
                    </button>

                    <button
                        type="button"
                        onClick={handlePublicar}
                        disabled={selectedIds.length === 0 || isBusy}
                        className={`${boton} bg-orange-500 hover:bg-orange-600`}>
                        🚀 {busy === "publicar" ? "Publicando..." : `Publicar (${selectedIds.length})`}
                    </button>
                </div>
                {duplicadas > 0 && (
                    <p className="mt-3 text-sm text-yellow-800">
                        ⚠️ {duplicadas} OS duplicada{duplicadas === 1 ? "" : "s"} en la lista: quedan como histórico y no se
                        pueden publicar.
                    </p>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
                {loadingList ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
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
                                            checked={allSelected}
                                            disabled={publicables.length === 0}
                                            onChange={handleSelectAll}
                                            className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
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
                                {programaciones.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={COLUMNAS.length + 1}
                                            className="px-4 py-8 text-center text-gray-500">
                                            No hay programaciones precargadas. Carga un archivo Excel para comenzar.
                                        </td>
                                    </tr>
                                ) : (
                                    programaciones.map((prog) => {
                                        const publicable = esPublicable(prog);
                                        return (
                                            <tr key={prog.id} className={publicable ? "hover:bg-gray-50" : "bg-red-50/40"}>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Seleccionar OS ${prog.numero_os}`}
                                                        title={publicable ? undefined : "OS duplicada: no se puede publicar"}
                                                        checked={selectedIds.includes(prog.id)}
                                                        disabled={!publicable}
                                                        onChange={() => handleSelectOne(prog.id)}
                                                        className="text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {prog.numero_os}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {prog.nombre || "—"}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {prog.municipio || "—"}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {prog.formulario}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {prog.creado_por}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {prog.asignado_a}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {formatFecha(prog.fecha_estimada_resolucion)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <InsertarBadge value={prog.insertar} />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <ValidacionBadge value={prog.validacion} />
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
        </>
    );
};

export default Precargar;
