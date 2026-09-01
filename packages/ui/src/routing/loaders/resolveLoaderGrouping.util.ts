import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { deserializeGroupingFromURL } from '#ui/utils/urlState';

import { sanitizeGroupingByColumns } from '../shared/sanitizeGroupingByColumns.util';

type ResolveLoaderGroupingArgs<TData extends Record<string, unknown>> = {
  readonly columns?: readonly TableColumn<TData>[];
  readonly defaultGrouping?: TableGroupingState;
  readonly param: null | string | undefined;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

export const resolveLoaderGrouping = <TData extends Record<string, unknown>>({
  columns,
  defaultGrouping,
  param,
}: ResolveLoaderGroupingArgs<TData>) => {
  if (!columns) return NO_GROUPING;

  if (param === null && defaultGrouping) {
    return sanitizeGroupingByColumns({ columns, grouping: defaultGrouping });
  }

  if (!param) return NO_GROUPING;

  return sanitizeGroupingByColumns({
    columns,
    grouping: deserializeGroupingFromURL(param),
  });
};
