import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type ModalProps = {
  /**
   * Consumer override on the body region. The default `spacing.lg` inset suits
   * plain content; a child that brings its own edge-to-edge chrome (a Tabs
   * strip, say) zeroes the inline padding here instead of fighting it.
   */
  readonly bodyStylex?: StyleXStyles;
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly footer?: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
};
