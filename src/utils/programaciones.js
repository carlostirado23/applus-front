import { apiFetch, query } from '../api/client';

// Fecha sin hora. Prisma serializa las columnas DATE (fecha_estimada_resolucion, fecha_ejecucion)
// como "YYYY-MM-DDT00:00:00.000Z".
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z)?$/;

export const ESTADOS_EJECUCION = {
  SIN_RESULTADO: 'Sin resultado',
  EJECUTADA: 'Ejecutada',
  NO_EJECUTADA: 'No ejecutada',
  REPROGRAMADA: 'Reprogramada',
};

/**
 * Convierte el valor del backend a Date. Las fechas sin hora se toman como
 * fecha local: medianoche UTC en Colombia (UTC-5) se mostraría como el día anterior.
 */
export const parseFecha = (valor) => {
  if (!valor) return null;
  const match = typeof valor === 'string' ? valor.match(SOLO_FECHA) : null;
  const fecha = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const formatFecha = (valor) => {
  const fecha = parseFecha(valor);
  return fecha ? fecha.toLocaleDateString('es-CO') : '—';
};

/** Para timestamps reales (fecha_creacion): fecha y hora local. */
export const formatFechaHora = (valor) => {
  const fecha = parseFecha(valor);
  return fecha
    ? fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
    : '—';
};

/** "YYYY-MM-DD" para inputs type=date a partir de un valor del backend. */
export const aInputFecha = (valor) => {
  const fecha = parseFecha(valor);
  if (!fecha) return '';
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

/** "YYYY-MM-DD" de hoy en hora local. */
export const hoy = () => aInputFecha(new Date());

export const esInsertar = (valor) =>
  valor === true || valor === 1 || ['SI', 'SÍ', 'TRUE', '1'].includes(String(valor).trim().toUpperCase());

export const tieneValidacion = (programacion, estado) =>
  String(programacion?.validacion ?? '').trim().toUpperCase() === estado;

/** Publicable: OS nueva (no duplicada) con técnico asignado. El backend aplica la misma regla. */
export const esPublicable = (p) => esInsertar(p?.insertar) && Boolean(p?.tecnico_id);

/** Límites del día en hora local del navegador, a partir de "YYYY-MM-DD". */
export const inicioDelDia = (dia) => (dia ? new Date(`${dia}T00:00:00`) : null);
export const finDelDia = (dia) => (dia ? new Date(`${dia}T23:59:59.999`) : null);

/**
 * Convierte los filtros del front a query params del backend.
 * fechaInicio/fechaFin se envían como instantes ISO (día local completo); el backend los respeta exactos.
 */
export const paramsProgramaciones = ({ fechaInicio, fechaFin, campoFecha, ...resto } = {}) => ({
  fecha_inicial: fechaInicio ? inicioDelDia(fechaInicio).toISOString() : undefined,
  fecha_final: fechaFin ? finDelDia(fechaFin).toISOString() : undefined,
  campo_fecha: campoFecha,
  ...resto,
});

/**
 * GET /programaciones. Filtros: fechaInicio, fechaFin, campoFecha, validacion, estado_ejecucion,
 * tecnico_id, municipio, q, page, limit. Sin `page` devuelve un arreglo; con `page` devuelve { data, total, page, limit, paginas }.
 */
export const fetchProgramaciones = async (filtros = {}) => {
  const data = await apiFetch(`/programaciones${query(paramsProgramaciones(filtros))}`);
  if (filtros.page) return data?.data ? data : { data: [], total: 0, page: 1, limit: filtros.limit ?? 25, paginas: 1 };
  return Array.isArray(data) ? data : [];
};

/** GET /usuarios/tecnicos (activos). */
export const fetchTecnicos = async ({ inactivos = false } = {}) => {
  const data = await apiFetch(`/usuarios/tecnicos${inactivos ? '?inactivos=true' : ''}`);
  return Array.isArray(data) ? data : [];
};

/** Descarga un { fileName, dataUrl } devuelto por el backend. */
export const descargarDataUrl = (data, nombrePorDefecto = 'archivo.xlsx') => {
  if (!data?.dataUrl) throw new Error('No se recibió el archivo');
  const a = document.createElement('a');
  a.href = data.dataUrl;
  a.download = data.fileName || nombrePorDefecto;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const MAX_EXCEL_BYTES = 10 * 1024 * 1024; // límite del backend

/** Valida un archivo Excel antes de subirlo. Devuelve el mensaje de error o null. */
export const validarExcel = (file) => {
  if (!file) return 'Selecciona un archivo';
  if (!/\.xlsx$/i.test(file.name)) return 'Solo se aceptan archivos .xlsx';
  if (file.size > MAX_EXCEL_BYTES) return 'El archivo supera el tamaño máximo permitido (10 MB)';
  return null;
};
