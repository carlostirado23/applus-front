import { useEffect, useState } from 'react';
import { fetchTecnicos } from '../utils/programaciones';
import { input } from './ui';

/**
 * Select de técnicos activos. `value` = id (string o número) o ''.
 * `opcionTodos` muestra "Todos" con valor ''; `opcionSin` agrega "Sin técnico" con valor 'sin' (filtro del backend).
 */
const SelectTecnico = ({ value, onChange, opcionTodos = false, opcionSin = false, placeholder = 'Selecciona un técnico', className = '', ...props }) => {
  const [tecnicos, setTecnicos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    fetchTecnicos()
      .then((lista) => activo && setTecnicos(lista))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${input} ${className}`} {...props}>
      <option value="">{error ? `Error: ${error}` : opcionTodos ? 'Todos los técnicos' : placeholder}</option>
      {opcionSin && <option value="sin">Sin técnico</option>}
      {tecnicos.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre}
          {t.municipio ? ` · ${t.municipio}` : ''}
        </option>
      ))}
    </select>
  );
};

export default SelectTecnico;
