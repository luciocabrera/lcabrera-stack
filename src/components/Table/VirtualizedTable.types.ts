export type VirtualizedTableColumn = {
  dataType?: 'boolean' | 'currency' | 'date' | 'number' | 'string';
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
