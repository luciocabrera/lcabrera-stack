import type { RefObject } from 'react';

import type { VirtualizedTableColumn } from '../../types';

export type VirtualizedTableBodyProps<T extends Record<string, unknown>> = {
  columns: VirtualizedTableColumn[];
  data: T[];
  overscan: number;
  rowHeight: number;
  tableContainerRef: RefObject<HTMLDivElement | null>;
};
