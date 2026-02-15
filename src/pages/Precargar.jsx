import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const Precargar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [programaciones, setProgramaciones] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const { getToken } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchProgramaciones();
    }, []);

    const fetchProgramaciones = async () => {
        try {
            const response = await fetch(`${API_URL}/programaciones/`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Mostrar solo programaciones con validación PENDIENTE (insensible a mayúsculas)
                const all = data.programaciones || data.historico || data || [];
                setProgramaciones(
                    Array.isArray(all)
                        ? all.filter((p) => p.validacion && p.validacion.toUpperCase() === "PENDIENTE")
                        : [],
                );
            }
        } catch (error) {
            console.error("Error al cargar programaciones:", error);
        }
    };

    const handleDescargarPlantilla = async () => {
        try {
            const response = await fetch(`${API_URL}/programaciones/descargar-plantilla`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (!response.ok) throw new Error("No se pudo descargar la plantilla");

            const data = await response.json();
            const { fileName, dataUrl } = data;
            if (!dataUrl) throw new Error("No se recibió el archivo");

            // Crear un enlace y descargar el archivo desde el dataUrl
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = fileName || "plantilla_programaciones.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();

            setMessage({ type: "success", text: "Plantilla descargada correctamente" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Error al descargar plantilla" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
    };

    const handleCargarExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_URL}/programaciones/cargar-excel`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Excel cargado correctamente" });
                fetchProgramaciones();
            } else {
                setMessage({ type: "error", text: data.message || "Error al cargar Excel" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error al cargar Excel" });
        }

        setLoading(false);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        e.target.value = "";
    };

    const handleSelectAll = () => {
        if (selectedIds.length === programaciones.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(programaciones.map((p) => p.id));
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handlePublicar = async () => {
        if (selectedIds.length === 0) {
            setMessage({ type: "error", text: "Seleccione al menos una programación" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/programaciones/publicar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (response.ok) {
                setMessage({ type: "success", text: "Programaciones publicadas correctamente" });
                setSelectedIds([]);
                fetchProgramaciones();
            } else {
                setMessage({ type: "error", text: "Error al publicar programaciones" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error al publicar programaciones" });
        }

        setLoading(false);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-col flex-1 lg:ml-64">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-4 overflow-y-auto sm:p-6 lg:p-8">
                    <div className="mb-6">
                        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">Precargar Programación</h1>
                        <p className="text-gray-600">Carga y gestiona programaciones antes de publicar</p>
                    </div>

                    {message.text && (
                        <div
                            className={`mb-4 p-4 rounded-lg ${
                                message.type === "success"
                                    ? "bg-green-50 border border-green-200 text-green-700"
                                    : "bg-red-50 border border-red-200 text-red-700"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="p-4 mb-6 bg-white shadow-md rounded-xl sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <button
                                onClick={handleDescargarPlantilla}
                                className="flex-1 px-6 py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg sm:flex-none hover:bg-blue-600">
                                📥 Descargar Plantilla
                            </button>

                            <label className="flex-1 px-6 py-3 font-semibold text-center text-white transition-colors bg-green-500 rounded-lg cursor-pointer sm:flex-none hover:bg-green-600">
                                📤 Cargar Excel
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleCargarExcel}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={handleSelectAll}
                                disabled={programaciones.length === 0}
                                className="flex-1 px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg sm:flex-none hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                {selectedIds.length === programaciones.length
                                    ? "☑️ Deseleccionar Todos"
                                    : "☑️ Seleccionar Todos"}
                            </button>

                            <button
                                onClick={handlePublicar}
                                disabled={selectedIds.length === 0 || loading}
                                className="flex-1 px-6 py-3 font-semibold text-white transition-colors bg-orange-500 rounded-lg sm:flex-none hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                🚀 Publicar ({selectedIds.length})
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-md rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedIds.length === programaciones.length &&
                                                    programaciones.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </th>
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
                                    {programaciones.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                                No hay programaciones precargadas. Carga un archivo Excel para comenzar.
                                            </td>
                                        </tr>
                                    ) : (
                                        programaciones.map((prog) => (
                                            <tr key={prog.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(prog.id)}
                                                        onChange={() => handleSelectOne(prog.id)}
                                                        className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {prog.numero_os}
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
                                                    {prog.fecha_estimada_resolucion
                                                        ? new Date(prog.fecha_estimada_resolucion).toLocaleDateString(
                                                              "es-ES",
                                                          )
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            prog.insertar === true || prog.insertar === "SI"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {prog.insertar === false || prog.insertar === "NO"
                                                            ? "NO"
                                                            : "SI"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            prog.validacion === "OK"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                        {prog.validacion}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Precargar;
