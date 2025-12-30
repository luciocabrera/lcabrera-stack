import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemStyle,
  DesignSystemWidth,
} from '@/types/design-system.types';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  color?: DesignSystemColor;
  customStylex?: StyleXStyles;
  icon?: ReactNode;
  isDisabled?: boolean;
  orientation?: DesignSystemOrientation;
  size?: DesignSystemSize;
  variant?: DesignSystemStyle;
  width?: DesignSystemWidth;
};
