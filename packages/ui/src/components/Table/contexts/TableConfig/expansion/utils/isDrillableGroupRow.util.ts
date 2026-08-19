import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

type IsDrillableGroupRowArgs = {
  /** Whether the route serves a drilled page at all (ADR-063). */
  readonly canDrill: boolean;
  /** The applied group keys — what "complete" is measured against. */
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary | undefined;
};

/**
 * Whether a group row can be drilled into its own rows (ADR-079).
 *
 * **The rule is stated over the row's own `path`**, never over the grouping
 * configuration alone — consistent with how the table decides everything else
 * about a row (ADR-067), and necessary because a group row survives a
 * configuration change intact while the configuration does not.
 *
 * Three conditions, each ruling out a row whose "children" are not rows:
 *
 * - **A complete grouping set.** One path entry per applied key. A shorter path
 *   is an outer level whose children are further group rows, already in memory;
 *   drilling it would fetch the detail rows of everything beneath it, which is
 *   neither what the row shows nor what its count says.
 * - **Not a subtotal.** A subtotal's children are the levels it totals, not
 *   rows.
 * - **A non-empty path.** The grand total is keyed by nothing and totals
 *   everything, so its "rows" are the whole table.
 *
 * The empty-path check is not redundant with the length comparison: with no
 * grouping applied both are zero, and a summary-carrying row in an ungrouped
 * result would otherwise report as drillable.
 */
export const isDrillableGroupRow = ({
  canDrill,
  groupingKeys,
  summary,
}: IsDrillableGroupRowArgs) =>
  canDrill &&
  summary !== undefined &&
  !summary.isSubtotal &&
  summary.path.length > 0 &&
  summary.path.length === groupingKeys.length;
