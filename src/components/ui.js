// Clases Tailwind compartidas para mantener el mismo aspecto en todas las páginas.

const base =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const btn = {
  primario: `${base} text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 disabled:shadow-none`,
  oscuro: `${base} text-white bg-gray-800 hover:bg-gray-900`,
  secundario: `${base} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400`,
  peligro: `${base} text-white bg-red-600 hover:bg-red-700`,
  /** Botón pequeño de ícono para filas de tabla */
  icono: 'p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
};

export const input =
  'w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:bg-gray-100 disabled:text-gray-500';

export const label = 'block mb-1 text-xs font-semibold text-gray-700';

export const th = 'px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap';
export const td = 'px-4 py-3 text-sm text-gray-600 whitespace-nowrap';

export const tarjeta = 'p-4 bg-white shadow-md rounded-xl sm:p-6';

export const spinner = 'w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin';
