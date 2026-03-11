import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type SidePanelSectionHeaderProps = ComponentPropsWithoutRef<'div'> & {
  title: string;
  toolbar?: ReactNode;
};
