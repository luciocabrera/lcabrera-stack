import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type SidePanelTitleProps = ComponentPropsWithoutRef<'h2'> & {
  icon?: ReactNode;
};
