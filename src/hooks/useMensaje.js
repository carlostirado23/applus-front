import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mensaje de estado de una página (éxito / advertencia / error) que se oculta solo.
 * Un solo temporizador: un mensaje nuevo no es borrado por el timeout del anterior.
 */
export default function useMensaje() {
  const [mensaje, setMensaje] = useState({ type: '', text: '' });
  const timer = useRef(null);

  const mostrar = useCallback((type, text) => {
    clearTimeout(timer.current);
    setMensaje({ type, text });
    timer.current = setTimeout(() => setMensaje({ type: '', text: '' }), type === 'success' ? 4000 : 8000);
  }, []);

  const limpiar = useCallback(() => {
    clearTimeout(timer.current);
    setMensaje({ type: '', text: '' });
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { mensaje, mostrar, limpiar };
}
