import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithRef } from 'react';

import type { DesignSystemSize } from '#ui/types/design-system.types';

export type TextInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'className' | 'size' | 'style'
> & {
  readonly customStylex?: StyleXStyles;
  readonly label?: string;
  readonly size?: DesignSystemSize;
};
