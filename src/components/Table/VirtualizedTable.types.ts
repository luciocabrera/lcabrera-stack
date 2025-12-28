import type { VirtualizedTableColumn } from './TableBody/TableBody.types';

export type VirtualizedTableProps<T extends Record<string, unknown>> = {
  columns: VirtualizedTableColumn[];
  data: T[];
  height?: number;
  overscan?: number;
  rowHeight?: number;
};

export { type VirtualizedTableColumn } from './TableBody/TableBody.types';
