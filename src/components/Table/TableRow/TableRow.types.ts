import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type TableRowProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: StyleXStyles;
  isHeader?: boolean;
  isStriped?: boolean;
};
