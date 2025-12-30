import type { ComponentPropsWithRef, RefObject } from 'react';

import type { TableProps } from '../Table.types';

export type TableBodyProps<TData extends Record<string, unknown>> =
  ComponentPropsWithRef<'tbody'> &
    Pick<TableProps<TData>, 'columns' | 'data' | 'isLoading' | 'locale' | 'overscan' | 'rowHeight'> & {
      /** Number of placeholder rows to show when loading with no data */
      placeholderRowCount?: number;
      tableContainerRef: RefObject<HTMLDivElement | null>;
    };
