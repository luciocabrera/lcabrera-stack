import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type FilterButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'color'
> & {
  /** Custom styles */
  customStylex?: StyleXStyles;
  /** Whether the column has an active filter */
  isActive?: boolean;
};
