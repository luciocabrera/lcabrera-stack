import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithRef } from 'react';

import type { DesignSystemSize } from '#ui/types/design-system.types';

export type SelectOption = {
  readonly label: string;
  readonly value: string;
};

export type SelectProps = Omit<
  ComponentPropsWithRef<'select'>,
  'children' | 'className' | 'size' | 'style'
> & {
  readonly customStylex?: StyleXStyles;
  readonly label?: string;
  readonly options: readonly SelectOption[];
  readonly size?: DesignSystemSize;
};
