const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Evento global: el servidor rechazó el token (expirado o inválido).
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export class ApiError extends Error {
  constructor(message, status, detalles) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }
}

const authHeaders = (auth) => {
  if (!auth) return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const manejarRespuestaFallida = (response, data, auth) => {
  if (response.status === 401 && auth) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(data?.message || 'Tu sesión expiró. Inicia sesión nuevamente.', 401);
  }
  throw new ApiError(data?.message || `Error del servidor (${response.status})`, response.status, data?.detalles);
};

/**
 * Wrapper de fetch: agrega el token, serializa JSON, unifica errores
 * y avisa cuando la sesión deja de ser válida (401).
 */
export async function apiFetch(path, { auth = true, body, headers, ...options } = {}) {
  const finalHeaders = { ...headers, ...authHeaders(auth) };
  let finalBody = body;

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers: finalHeaders, body: finalBody });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión.', 0);
  }

  // El backend puede responder sin cuerpo o con algo que no es JSON.
  const data = await response.json().catch(() => null);
  if (!response.ok) manejarRespuestaFallida(response, data, auth);
  return data;
}

/** Arma el query string a partir de un objeto, omitiendo valores vacíos. */
export const query = (params = {}) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
};

/**
 * Descarga un archivo del backend (xlsx) con el token y dispara la descarga en el navegador.
 * Agrega formato=archivo a la ruta. Devuelve el nombre del archivo.
 */
export async function apiDownload(path, nombrePorDefecto = 'archivo.xlsx') {
  const sep = path.includes('?') ? '&' : '?';
  let response;
  try {
    response = await fetch(`${API_URL}${path}${sep}formato=archivo`, { headers: authHeaders(true) });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión.', 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    manejarRespuestaFallida(response, data, true);
  }
  const disposition = response.headers.get('content-disposition') || '';
  const nombre = disposition.match(/filename="?([^";]+)"?/)?.[1] || nombrePorDefecto;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return nombre;
}
