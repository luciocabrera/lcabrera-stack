import type { ComponentPropsWithRef, RefObject } from 'react';

import type { TableProps } from '../Table.types';

export type TableBodyProps<TData extends Record<string, unknown>> =
  ComponentPropsWithRef<'tbody'> &
    Pick<TableProps<TData>, 'columns' | 'data' | 'overscan' | 'rowHeight'> & {
      tableContainerRef: RefObject<HTMLDivElement | null>;
    };
