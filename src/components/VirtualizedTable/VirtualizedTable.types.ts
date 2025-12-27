import type { VirtualizedTableColumn } from './types';

export type VirtualizedTableProps<T extends Record<string, unknown>> = {
  columns: VirtualizedTableColumn[];
  data: T[];
  height?: number;
  overscan?: number;
  rowHeight?: number;
};
