import type { ComponentPropsWithoutRef, RefObject } from 'react';

// import type { TableCustomStylex } from '../Table/Table.types';

// export type TableBodyProps<Row> = ComponentPropsWithoutRef<'div'> & {
//   customStylex?: TableCustomStylex;
//   emptyState?: ReactNode;
//   getRowKey?: (row: Row, index: number) => Key;
//   height?: number;
//   isStriped?: boolean;
//   renderRow: (row: Row, index: number) => ReactNode;
//   rowHeight?: number;
//   rows: readonly Row[];
// };

export type TableBodyProps<T extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'tbody'> & {
    columns: VirtualizedTableColumn[];
    data: T[];
    overscan: number;
    rowHeight: number;
    tableContainerRef: RefObject<HTMLDivElement | null>;
  };

export type VirtualizedTableColumn = {
  dataType?: 'boolean' | 'currency' | 'date' | 'number' | 'string';
  key: string;
  label: string;
  minWidth?: number;
};
