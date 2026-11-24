import { esInsertar } from '../utils/programaciones';

const base = 'px-2 py-1 text-xs font-semibold rounded-full';

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
