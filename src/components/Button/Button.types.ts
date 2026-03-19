import type { StyleXStyles } from '@stylexjs/stylex';
import type {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
} from 'react';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemStyle,
  DesignSystemWidth,
} from '@/types/design-system.types';

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick'
> & {
  color?: DesignSystemColor;
  customStylex?: StyleXStyles;
  icon?: ReactNode;
  isDisabled?: boolean;
  onClick?: (() => void) | MouseEventHandler<HTMLButtonElement>;
  orientation?: DesignSystemOrientation;
  size?: DesignSystemSize;
  tooltipContent?: ReactNode;
  tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  variant?: DesignSystemStyle;
  width?: DesignSystemWidth;
};
