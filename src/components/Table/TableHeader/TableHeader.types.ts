import type { ComponentPropsWithoutRef } from 'react';

import type { SortDirection, TableProps } from '../Table.types';

export type HandleResizeParams = {
  columnKey: string;
  width: number;
};

export type HandleSortParams = {
  columnKey: string;
  direction: SortDirection;
  isMultiSort?: boolean;
};

export type TableHeaderProps<TData extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'thead'> &
    Pick<TableProps<TData>, 'columns' | 'customStylex' | 'data'> & {
      /** Show skeleton loading state in header cells */
      isLoading?: boolean;
    };
