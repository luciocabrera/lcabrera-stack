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
   * The raw param: `null` for a route that allows grouping and received none,
   * a string for one that received it, and `undefined` for a route that opted
   * out of the param entirely. The three are not interchangeable here — see
   * below.
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
 * The grouping a loader run applies: the URL's, this route's declared default,
 * or none.
 *
 * **The default applies only to `null` — a URL with no `grouping` param at
 * all.** That is the whole reason the raw param is threaded here instead of the
 * parsed state: `keys: []` is what both an absent param and an explicitly
 * cleared one deserialize to, and a default that could not tell them apart
 * would re-apply itself the moment the user cleared it. Every navigation that
 * writes some other param (a filter, a sort) would then re-group the table
 * under them (#578).
 *
 * The other half of that guarantee is on the write side: with a default
 * declared, clearing serializes the empty envelope rather than dropping the
 * param, so "off" survives in the URL as a string this branch never sees.
 *
 * **The default is sanitized against the route's columns exactly as a
 * URL-supplied one is.** It is authored in code rather than by a visitor, so it
 * is not hostile — but a key naming a column that was since renamed reaches SQL
 * as an identifier either way, and a preset is the one grouping nobody has to
 * type to run into.
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
