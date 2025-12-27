export type VirtualizedTableColumn = {
  key: string;
  label: string;
  minWidth?: number;
};


export type VirtualizedTableProps<T extends Record<string, unknown>> = {
  columns: VirtualizedTableColumn[];
  data: T[];
  height?: number;
  overscan?: number;
  rowHeight?: number;
};
