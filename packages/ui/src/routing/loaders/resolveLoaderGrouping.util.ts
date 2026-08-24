import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { deserializeGroupingFromURL } from '#ui/utils/urlState';

import { sanitizeGroupingByColumns } from '../shared/sanitizeGroupingByColumns.util';

type ResolveLoaderGroupingArgs<TData extends Record<string, unknown>> = {
  readonly columns?: readonly TableColumn<TData>[];
  /**
   * The route's curated grouping, applied only where the URL carried no
   * `grouping` param at all.
   */
  readonly defaultGrouping?: TableGroupingState;
  /**
   * The raw param: `null` for a route that allows grouping and received none, a string for
   * one that received it, and `undefined` for a route that opted out of the param entirely.
   */
  readonly param: null | string | undefined;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

/**
 * The grouping a loader run applies: the URL's, this route's declared default, or none.
 * **The default applies only to `null` — a URL with no `grouping` param at all.** That is
 * the whole reason the raw param is threaded here instead of the parsed state: `keys: []`
 * is what both an absent param and an explicitly cleared one deserialize to, and a default
 * that could not tell them apart would re-apply itself the moment the user cleared it.
 */
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
