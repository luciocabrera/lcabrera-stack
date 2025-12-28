import type { ComponentPropsWithoutRef, RefObject } from 'react';

import type { TableProps } from '../Table.types';

export type TableHeaderProps<TData extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'thead'> &
    Pick<TableProps<TData>, 'columns' | 'customStylex'> & {
      tableContainerRef: RefObject<HTMLDivElement | null>;
    };
