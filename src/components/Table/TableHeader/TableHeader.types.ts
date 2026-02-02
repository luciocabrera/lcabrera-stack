import type { ComponentPropsWithoutRef } from 'react';

import type { ColumnFilter } from '@/types/filterOperators.types';

import type {  TableProps } from '../Table.types';

export type HandleFilterParams = {
  columnKey: string;
  filter?: ColumnFilter;
};

export type HandleResizeParams = {
  columnKey: string;
  width: number;
};


export type TableHeaderProps<
  TData extends Record<string, unknown>,
  TResponse,
> = ComponentPropsWithoutRef<'thead'> &
  Pick<TableProps<TData, TResponse>, 'customStylex'>;
