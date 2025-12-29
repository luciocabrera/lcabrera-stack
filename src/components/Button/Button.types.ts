import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  color?: ButtonColor;
  customStylex?: StyleXStyles;
  isDisabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonStyle;
  width?: ButtonWidth;
};

type ButtonColor =
  | 'error'
  | 'ghost'
  | 'outline'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';

type ButtonSize = 'lg' | 'md' | 'sm';
type ButtonStyle = 'elevated' | 'flat' | 'solid';

type ButtonWidth = 'auto' | 'full';
