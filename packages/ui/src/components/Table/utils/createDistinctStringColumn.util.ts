import type { FilterOptionsResponse, TableColumn } from '../Table.types';

import { createDistinctFilterOptions } from '../../../utils/filters';

type CreateDistinctStringColumnArgs<TData extends Record<string, unknown>> = {
  readonly columnName: keyof TData;
  readonly fetchDistinctValues: (
    args: FetchDistinctValuesArgs<TData>,
  ) => Promise<FilterOptionsResponse>;
  readonly isPrimaryKey?: boolean;
  readonly key: keyof TData & string;
  readonly label: string;
  readonly maxWidth: number;
  readonly minWidth: number;
};

type FetchDistinctValuesArgs<TData extends Record<string, unknown>> = {
  readonly columnName: keyof TData;
  readonly limit: number;
  readonly offset: number;
};

export const createDistinctStringColumn = <
  TData extends Record<string, unknown>,
>({
  columnName,
  fetchDistinctValues,
  isPrimaryKey,
  key,
  label,
  maxWidth,
  minWidth,
}: CreateDistinctStringColumnArgs<TData>): TableColumn<TData> => {
  return {
    dataType: 'string',
    ...createDistinctFilterOptions<TData>({
      columnName,
      fetchDistinctValues,
    }),
    key,
    label,
    maxWidth,
    minWidth,
    ...(isPrimaryKey === true && { isPrimaryKey }),
  };
};
