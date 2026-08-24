import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

type ResolveGroupDetailsHrefArgs = {
  /** Where the route serves one group's rows, or `undefined` if it does not. */
  readonly groupDetailsPath: string | undefined;
  /** The applied group keys — what "complete" is measured against. */
  readonly groupingKeys: readonly string[];
  /** The granularity each temporal key was grouped at, by column. */
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  /** The current location's search, so every other param survives. */
  readonly search: string;
  readonly summary: TableGroupRowSummary;
};

/**
 * The link that opens this group's rows, or `undefined` when this row has none
 * to open (#870).
 *
 * **A complete grouping set, and not a subtotal.** One path entry per applied
 * key: a shorter path is an outer level whose children are already on screen as
 * further group rows, and a rollup subtotal is shorter by definition. The
 * empty-path check is not redundant with the length comparison — with no
 * grouping applied both are zero, and the grand total would otherwise offer a
 * link to every row in the table.
 *
 * **Every other search param is carried through**, because opening a group
 * changes what is being asked and not how the rest of the page is configured.
 * The list's `filters` and `sorting` in particular are the floor the modal
 * inherits: the group row was computed under them, so a link that dropped them
 * would open on a larger set than the count it sits beside.
 *
 * **The token is built by `@lcabrera/api`, not here.** Its parser is the other
 * half of one codec (ADR-082), and a request written by hand beside a reader
 * written elsewhere is behaviour duplicated rather than a shape — which is how
 * the `undefined`-valued key that JSON silently drops went unnoticed. Dropping
 * the display `label` is part of that contract: what a read is built from is
 * the raw value.
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

  const params = new URLSearchParams(search);

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
