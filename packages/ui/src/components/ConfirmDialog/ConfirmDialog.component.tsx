import { ActionButtons } from '@repo/ui/components/ActionButtons';
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
      <ActionButtons
        actions={[
          {
            color: 'error',
            key: 'confirm',
            label: confirmLabel,
            onClick: onConfirm,
          },
          {
            color: 'outline',
            key: 'cancel',
            label: cancelLabel,
            onClick: onCancel,
          },
        ]}
      />
    }
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
  >
    {description && <p>{description}</p>}
  </Modal>
);
