import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type HandleToggleVisibilityArgs = {
  columnKey: string;
  isVisible: boolean;
};
