import { Button } from '@repo/ui/components/Button';
import { Modal } from '@repo/ui/components/Modal';

import type { ConfirmDialogProps } from './ConfirmDialog.types';

/**
 * Generic yes/no confirmation prompt — first consumer is Form's
 * discard-unsaved-changes-on-cancel flow, but it's a plain `Modal`
 * composition with no Form dependency, reusable anywhere a destructive or
 * irreversible action needs an explicit second confirmation.
 */
export const ConfirmDialog = ({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) => (
  <Modal
    footer={
      <>
        <Button color='ghost' onClick={onCancel} type='button' variant='flat'>
          {cancelLabel}
        </Button>
        <Button color='error' onClick={onConfirm} type='button'>
          {confirmLabel}
        </Button>
      </>
    }
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
  >
    {description && <p>{description}</p>}
  </Modal>
);
