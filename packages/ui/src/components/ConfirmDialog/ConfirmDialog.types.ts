export type ConfirmDialogProps = {
  readonly cancelLabel?: string;
  readonly confirmLabel?: string;
  readonly description?: string;
  readonly isOpen: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
};
