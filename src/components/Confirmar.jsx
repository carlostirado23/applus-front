import Modal from './Modal';
import { btn } from './ui';

/**
 * Diálogo de confirmación. `onConfirm` puede ser async; el botón se deshabilita mientras corre.
 * `peligro` pinta el botón en rojo (acciones destructivas).
 */
const Confirmar = ({ open, onClose, onConfirm, title = '¿Confirmar?', children, confirmText = 'Confirmar', peligro = false, busy = false }) => (
  <Modal
    open={open}
    onClose={busy ? undefined : onClose}
    title={title}
    size="sm"
    footer={
      <>
        <button type="button" onClick={onClose} disabled={busy} className={btn.secundario}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={peligro ? btn.peligro : btn.primario}>
          {busy ? 'Procesando...' : confirmText}
        </button>
      </>
    }
  >
    <div className="text-sm text-gray-700">{children}</div>
  </Modal>
);

export default Confirmar;
