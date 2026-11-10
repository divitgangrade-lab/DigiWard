import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Thin wrapper over the native <dialog>: focus trapping, Escape handling and
 * inert background come from the platform, not a hand-rolled key handler.
 */
export function Dialog({ open, labelledBy, onClose, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handleClose = () => onClose();
    node.addEventListener('close', handleClose);
    return () => node.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={className ? `dialog ${className}` : 'dialog'}
      aria-labelledby={labelledBy}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
