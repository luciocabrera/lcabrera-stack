import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  DesignSystemColor,
  DesignSystemSize,
  DesignSystemStyle,
  DesignSystemWidth,
} from '@/types/design-system.types';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  color?: DesignSystemColor;
  customStylex?: StyleXStyles;
  icon?: ReactNode;
  isDisabled?: boolean;
  size?: DesignSystemSize;
  variant?: DesignSystemStyle;
  width?: DesignSystemWidth;
};
