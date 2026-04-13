import type { ComponentPropsWithoutRef } from 'react';

export type CardColor =
  | 'default'
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';

export type CardElevation = 'flat' | 'lg' | 'md' | 'sm' | 'xl';

export type CardInteractive = 'clickable' | 'hoverable' | 'static';

export type CardPadding = 'lg' | 'md' | 'none' | 'sm' | 'xl';

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  readonly color?: CardColor;
  readonly elevation?: CardElevation;
  readonly interactive?: CardInteractive;
  readonly padding?: CardPadding;
};
