import type { ComponentPropsWithoutRef, RefObject } from 'react';

import type { VirtualizedTableColumn } from '../VirtualizedTable.types';

export type TableBodyProps<T extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'tbody'> & {
    columns: VirtualizedTableColumn[];
    data: T[];
    overscan: number;
    rowHeight: number;
    tableContainerRef: RefObject<HTMLDivElement | null>;
  };
