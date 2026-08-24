import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';

type ResolveGroupDetailsHrefArgs = {
  readonly groupDetailsPath: string | undefined;
  readonly groupingKeys: readonly string[];
  /** The granularity each temporal key was grouped at, by column. */
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  readonly search: string;
  readonly summary: TableGroupRowSummary;
};

/**
 * **A complete grouping set, and not a subtotal.** One path entry per applied key: a
 * shorter path is an outer level whose children are already on screen as further group
 * rows, and a rollup subtotal is shorter by definition.
 * The empty-path check is not redundant with the length comparison — with no grouping
 * applied both are zero, and the grand total would otherwise offer a link to every row in
 * the table.
 */
export const resolveGroupDetailsHref = ({
  groupDetailsPath,
  groupingKeys,
  periods,
  search,
  summary,
}: ResolveGroupDetailsHrefArgs) => {
  if (
    groupDetailsPath === undefined ||
    summary.isSubtotal ||
    summary.path.length === 0 ||
    summary.path.length !== groupingKeys.length
  ) {
    return;
  }

  // Built without the nested params rather than copying and deleting: one
  // already in `search` was written inside a *different* group's route and
  // describes that group's set. Carried through, it would open this group
  // narrower than the count on the row it was clicked from — the mismatch the
  // seeding below prevents, in the other direction.
  const params = new URLSearchParams(
    [...new URLSearchParams(search)].filter(
      ([key]) => !key.startsWith(TABLE_NESTED_URL_STATE_PREFIX),
    ),
  );

  for (const key of ['filters', 'sorting']) {
    const value = params.get(key);

    if (value !== null) {
      params.set(`${TABLE_NESTED_URL_STATE_PREFIX}${key}`, value);
    }
  }

  params.set(
    OLAP_DRILL_GROUP_PARAM,
    encodeDrillGroup({
      group: { isSubtotal: false, path: summary.path },
      groupKeys: groupingKeys,
      periods,
    }),
  );

  return `${groupDetailsPath}?${params.toString()}`;
};
