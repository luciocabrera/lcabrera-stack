import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
} from 'react';

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick'
> & {
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly isBusy?: boolean;
  readonly isDisabled?: boolean;
  readonly isIconOnly?: boolean;
  readonly onClick?: (() => void) | MouseEventHandler<HTMLButtonElement>;
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
  readonly tooltipContent?: ReactNode;
  readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  readonly variant?: DesignSystemColor;
};
