const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Evento global: el servidor rechazó el token (expirado o inválido).
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Wrapper de fetch: agrega el token, serializa JSON, unifica errores
 * y avisa cuando la sesión deja de ser válida (401).
 */
export async function apiFetch(path, { auth = true, body, headers, ...options } = {}) {
  const finalHeaders = { ...headers };
  let finalBody = body;

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión.', 0);
  }

  // El backend puede responder sin cuerpo o con algo que no es JSON.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      throw new ApiError('Tu sesión expiró. Inicia sesión nuevamente.', 401);
    }
    throw new ApiError(data?.message || `Error del servidor (${response.status})`, response.status);
  }

  return data;
}
