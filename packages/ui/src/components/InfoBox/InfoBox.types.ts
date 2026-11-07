import type { ComponentPropsWithoutRef } from 'react';

export type InfoBoxProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'style'
> & {
  readonly tone?: InfoBoxTone;
};

export type InfoBoxTone = 'error' | 'info' | 'neutral' | 'success' | 'warning';
