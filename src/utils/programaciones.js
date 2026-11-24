import { apiFetch } from '../api/client';

// Fecha sin hora. Prisma serializa las columnas DATE (fecha_estimada_resolucion)
// como "YYYY-MM-DDT00:00:00.000Z".
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z)?$/;

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

export const esInsertar = (valor) =>
  valor === true || valor === 1 || ['SI', 'SÍ', 'TRUE', '1'].includes(String(valor).trim().toUpperCase());

export const tieneValidacion = (programacion, estado) =>
  String(programacion?.validacion ?? '').trim().toUpperCase() === estado;

/** Límites del día en hora local del navegador, a partir de "YYYY-MM-DD". */
export const inicioDelDia = (dia) => (dia ? new Date(`${dia}T00:00:00`) : null);
export const finDelDia = (dia) => (dia ? new Date(`${dia}T23:59:59.999`) : null);

/**
 * GET /programaciones. El backend filtra por fecha_creacion (fecha de carga).
 * Se envían instantes ISO (inicio y fin del día en hora local del navegador)
 * y el backend los respeta exactos, sin redondear al día UTC.
 */
export const fetchProgramaciones = async ({ fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (fechaInicio) params.set('fecha_inicial', inicioDelDia(fechaInicio).toISOString());
  if (fechaFin) params.set('fecha_final', finDelDia(fechaFin).toISOString());
  const query = params.toString();

  const data = await apiFetch(`/programaciones${query ? `?${query}` : ''}`);
  return Array.isArray(data) ? data : [];
};
