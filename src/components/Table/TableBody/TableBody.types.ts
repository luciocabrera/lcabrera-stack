import type { ComponentPropsWithoutRef, Key, ReactNode } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';

export type TableBodyProps<Row> = ComponentPropsWithoutRef<'div'> & {
  customStylex?: TableCustomStylex;
  emptyState?: ReactNode;
  getRowKey?: (row: Row, index: number) => Key;
  height?: number;
  isStriped?: boolean;
  renderRow: (row: Row, index: number) => ReactNode;
  rowHeight?: number;
  rows: readonly Row[];
};
