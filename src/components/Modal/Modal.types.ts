import type { ReactNode } from 'react';

export type ModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};
