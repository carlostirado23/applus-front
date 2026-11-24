import Icon from './Icon';
import { btn } from './ui';

/** Controles de paginación para listados del backend ({ page, paginas, total, limit }). */
const Paginacion = ({ page, paginas, total, limit, onChange, disabled = false }) => {
  if (!total) return null;
  const desde = (page - 1) * limit + 1;
  const hasta = Math.min(page * limit, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 text-sm text-gray-600 border-t border-gray-200 sm:flex-row">
      <span>
        Mostrando {desde}–{hasta} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
          className={`${btn.secundario} px-2!`}
          aria-label="Página anterior"
        >
          <Icon name="chevronLeft" className="w-4 h-4" />
        </button>
        <span>
          Página {page} de {paginas}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= paginas}
          className={`${btn.secundario} px-2!`}
          aria-label="Página siguiente"
        >
          <Icon name="chevronRight" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Paginacion;
