import { esInsertar, ESTADOS_EJECUCION } from '../utils/programaciones';

const base = 'inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap';

export const InsertarBadge = ({ value }) => {
  const si = esInsertar(value);
  return (
    <span className={`${base} ${si ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {si ? 'SI' : 'NO'}
    </span>
  );
};

export const ValidacionBadge = ({ value }) => {
  const estado = String(value ?? '').trim().toUpperCase();
  const ok = estado === 'OK' || estado === 'PUBLICADO';
  return (
    <span className={`${base} ${ok ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {value || '—'}
    </span>
  );
};

const COLORES_EJECUCION = {
  SIN_RESULTADO: 'bg-gray-100 text-gray-700',
  EJECUTADA: 'bg-green-100 text-green-800',
  NO_EJECUTADA: 'bg-red-100 text-red-800',
  REPROGRAMADA: 'bg-blue-100 text-blue-800',
};

export const EstadoEjecucionBadge = ({ value }) => {
  const estado = String(value ?? 'SIN_RESULTADO').toUpperCase();
  return (
    <span className={`${base} ${COLORES_EJECUCION[estado] || COLORES_EJECUCION.SIN_RESULTADO}`}>
      {ESTADOS_EJECUCION[estado] || value || '—'}
    </span>
  );
};

const COLORES_ROL = {
  ADMIN: 'bg-brand-100 text-brand-800',
  SUPERVISOR: 'bg-blue-100 text-blue-800',
  TECNICO: 'bg-gray-100 text-gray-700',
};

// eslint-disable-next-line react-refresh/only-export-components
export const ROLES_LABEL = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', TECNICO: 'Técnico' };

export const RolBadge = ({ value }) => (
  <span className={`${base} ${COLORES_ROL[value] || COLORES_ROL.TECNICO}`}>{ROLES_LABEL[value] || value}</span>
);

export const ActivoBadge = ({ value }) => (
  <span className={`${base} ${value ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
    {value ? 'Activo' : 'Inactivo'}
  </span>
);

/** Técnico asignado o aviso de que falta. */
export const TecnicoBadge = ({ programacion }) => {
  if (programacion?.tecnico) {
    return (
      <span className="text-sm text-gray-800" title={`Usuario: ${programacion.tecnico.usuario}`}>
        {programacion.tecnico.nombre}
      </span>
    );
  }
  if (!esInsertar(programacion?.insertar)) return <span className="text-sm text-gray-400">—</span>;
  return (
    <span className={`${base} bg-amber-100 text-amber-800`} title={programacion?.asignado_a ? `En el Excel: "${programacion.asignado_a}"` : undefined}>
      Sin técnico
    </span>
  );
};
