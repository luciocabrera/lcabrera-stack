import type { ComponentPropsWithoutRef, RefObject } from 'react';

import type { TableColumn } from '../Table.types';

export type TableBodyProps<T extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'tbody'> & {
    columns: TableColumn[];
    data: T[];
    overscan: number;
    rowHeight: number;
    tableContainerRef: RefObject<HTMLDivElement | null>;
  };
