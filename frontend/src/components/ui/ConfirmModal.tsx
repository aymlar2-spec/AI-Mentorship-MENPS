import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  variant?: "danger" | "primary";
}

/**
 * ConfirmModal — MENPS design-system component.
 * Reusable confirmation dialog for destructive actions (delete a
 * conversation, a user, a theme, ...) — built on Modal.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  isConfirming = false,
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Annuler
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-muted">{description}</p>
    </Modal>
  );
}
