import type { ComponentPropsWithoutRef } from 'react';

import type { ColumnFilter } from '@/types/filterOperators.types';

import type { SortDirection, TableProps } from '../Table.types';

export type HandleFilterParams = {
  columnKey: string;
  filter?: ColumnFilter;
};

export type HandleResizeParams = {
  columnKey: string;
  width: number;
};

export type HandleSortParams = {
  columnKey: string;
  direction?: SortDirection;
  // isMultiSort?: boolean;
};

export type TableHeaderProps<
  TData extends Record<string, unknown>,
  TResponse,
> = ComponentPropsWithoutRef<'thead'> &
  Pick<TableProps<TData, TResponse>, 'customStylex'>;
