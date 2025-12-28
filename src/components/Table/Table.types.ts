export type TableColumn = {
  dataType?: 'boolean' | 'currency' | 'date' | 'number' | 'string';
  key: string;
  label: string;
  minWidth?: number;
};

export type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn[];
  data: T[];
  height?: number;
  overscan?: number;
  rowHeight?: number;
};

