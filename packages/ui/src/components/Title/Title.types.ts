import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentProps, ReactNode } from 'react';

export type TitleLevel = 1 | 2 | 3;

export type TitleProps = Omit<ComponentProps<'div'>, 'className' | 'style'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly level?: TitleLevel;
  /** The `toolbar` variant's density: a tighter block padding and a title size per step. Unset keeps the roomy toolbar with the `md` title size; `plain` ignores it. */
  readonly size?: TitleSize;
  readonly variant?: TitleVariant;
};

export type TitleSize = 'lg' | 'md' | 'sm' | 'xl';

export type TitleVariant = 'plain' | 'toolbar';
