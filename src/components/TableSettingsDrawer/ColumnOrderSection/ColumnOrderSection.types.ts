import type { ComponentPropsWithoutRef } from 'react';

/**
 * ColumnOrderSection component props
 */
export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type HandleToggleVisibilityArgs = {
  columnKey: string;
  isVisible: boolean;
};
