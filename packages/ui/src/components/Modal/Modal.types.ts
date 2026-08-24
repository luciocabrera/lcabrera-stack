import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type ModalProps = {
  readonly bodyStylex?: StyleXStyles;
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly footer?: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
};
