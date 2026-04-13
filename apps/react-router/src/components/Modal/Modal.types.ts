import type { ReactNode } from 'react';

export type ModalProps = {
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
};
