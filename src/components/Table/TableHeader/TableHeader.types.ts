import type { ComponentPropsWithoutRef } from 'react';

import type { TableProps } from '../Table.types';
import type { SortDirection } from '../TableContext';

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
    Pick<TableProps<TData>, 'columns' | 'customStylex'> & {
      /** Show skeleton loading state in header cells */
      isLoading?: boolean;
    };
