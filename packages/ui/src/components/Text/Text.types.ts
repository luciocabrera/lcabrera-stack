import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TextElement =
  | 'dd'
  | 'div'
  | 'dt'
  | 'figcaption'
  | 'label'
  | 'p'
  | 'span';

export type TextOwnProps<TElement extends TextElement> = {
  readonly as?: 'p' | TElement;
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly isMono?: boolean;
  readonly isTabular?: boolean;
  readonly size?: TextSize;
  readonly tone?: TextTone;
  readonly weight?: TextWeight;
};

export type TextProps<TElement extends TextElement = 'p'> = Omit<
  ComponentPropsWithoutRef<TElement>,
  keyof TextOwnProps<TElement>
> &
  TextOwnProps<TElement>;

export type TextSize = 'lg' | 'md' | 'sm' | 'xs';

export type TextTone =
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'tertiary'
  | 'warning';

export type TextWeight = 'bold' | 'medium' | 'normal' | 'semibold';
