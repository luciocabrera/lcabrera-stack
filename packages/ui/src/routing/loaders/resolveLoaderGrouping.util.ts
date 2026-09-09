import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { getInitialGroupingState } from '#ui/components/Table/contexts/TableConfig/utils';
import { deserializeGroupingFromURL } from '#ui/utils/urlState';

import { sanitizeGroupingByColumns } from '../shared/sanitizeGroupingByColumns.util';

type ResolveLoaderGroupingArgs<TData extends Record<string, unknown>> = {
  readonly columns?: readonly TableColumn<TData>[];
  readonly defaultGrouping?: TableGroupingState;
  readonly param: null | string | undefined;
};

export const resolveLoaderGrouping = <TData extends Record<string, unknown>>({
  columns,
  defaultGrouping,
  param,
}: ResolveLoaderGroupingArgs<TData>) => {
  if (!columns) return getInitialGroupingState({});

  if (param === null && defaultGrouping) {
    return sanitizeGroupingByColumns({ columns, grouping: defaultGrouping });
  }

  if (!param) return getInitialGroupingState({});

  return sanitizeGroupingByColumns({
    columns,
    grouping: deserializeGroupingFromURL(param),
  });
};
