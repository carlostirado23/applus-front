import { useEffect } from 'react';
import Icon from './Icon';

const ANCHOS = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

/** Ventana modal. Cierra con Escape o clic fuera. `footer` opcional para botones. */
const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`flex flex-col w-full ${ANCHOS[size] || ANCHOS.md} max-h-[92vh] bg-white shadow-xl rounded-t-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
