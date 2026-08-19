import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

type IsDrillableGroupPathArgs = {
  /** Whether the route serves a drilled page at all (ADR-063). */
  readonly canDrill: boolean;
  /** The applied group keys — what "complete" is measured against. */
  readonly groupingKeys: readonly string[];
  readonly path: readonly TableGroupKeyValue[];
};

/**
 * Whether a group *path* names a row that could drill (ADR-079) — the half of
 * the question a path can answer on its own.
 *
 * A **complete** grouping set: one entry per applied key. A shorter path is an
 * outer level whose children are further group rows, already in memory, and a
 * rollup subtotal is always shorter than the key list because it is defined by
 * having rolled one up — so this rules subtotals out as a consequence rather
 * than by testing for them.
 *
 * The empty-path check is not redundant with the length comparison: with no
 * grouping applied both are zero, and the grand total would otherwise report as
 * drillable.
 *
 * `isDrillableGroupRow` adds the half only a **row** can answer — that it is not
 * a subtotal, stated rather than inferred — and is what the tree uses. This one
 * exists for the toggle, which is handed a path and nothing else.
 */
export const isDrillableGroupPath = ({
  canDrill,
  groupingKeys,
  path,
}: IsDrillableGroupPathArgs) =>
  canDrill && path.length > 0 && path.length === groupingKeys.length;
