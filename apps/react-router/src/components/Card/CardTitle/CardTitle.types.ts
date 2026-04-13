import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type CardTitleProps = ComponentPropsWithoutRef<'h3'> & {
  readonly icon?: ReactNode;
};
