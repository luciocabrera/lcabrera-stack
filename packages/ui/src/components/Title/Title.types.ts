import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentProps, ReactNode } from 'react';

export type TitleLevel = 1 | 2 | 3;

export type TitleProps = ComponentProps<'div'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly level?: TitleLevel;
  readonly variant?: TitleVariant;
};

export type TitleVariant = 'plain' | 'toolbar';
