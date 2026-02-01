import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type TableTitleProps = {
  /** Optional actions to display on the right side */
  actions?: ReactNode;
  customStylex?: StyleXStyles;
  /** Optional icon to display before the title */
  icon?: ReactNode;
};
