import Icon from './Icon';

const ESTILOS = {
  success: { caja: 'bg-green-50 border-green-200 text-green-700', icono: 'checkCircle' },
  warning: { caja: 'bg-yellow-50 border-yellow-200 text-yellow-800', icono: 'alert' },
  error: { caja: 'bg-red-50 border-red-200 text-red-700', icono: 'xCircle' },
  info: { caja: 'bg-blue-50 border-blue-200 text-blue-800', icono: 'info' },
};

/** Caja de mensaje. `mensaje` = { type, text } de useMensaje, o pasar `type` y children. */
const Alerta = ({ mensaje, type, children, className = '' }) => {
  const tipo = type || mensaje?.type;
  const texto = children ?? mensaje?.text;
  if (!tipo || !texto) return null;
  const estilo = ESTILOS[tipo] || ESTILOS.info;
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`mb-4 flex items-start gap-3 p-4 text-sm border rounded-lg ${estilo.caja} ${className}`}
    >
      <Icon name={estilo.icono} className="w-5 h-5 mt-0.5" />
      <div className="flex-1 min-w-0">{texto}</div>
    </div>
  );
};

export default Alerta;
