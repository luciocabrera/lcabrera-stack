import type { TableGroupDrill } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { TableGroupTreeRowMeta } from './resolveTableGroupTree.util';

import { resolveDrilledRows } from './resolveDrilledRows.util';

type DrilledEntry = {
  readonly meta: TableGroupTreeRowMeta;
  readonly row: Record<string, unknown>;
};

type ResolveDrilledBlockArgs = {
  readonly drill: TableGroupDrill | undefined;
  readonly isCollapsed: boolean;
  readonly isDrillable: boolean;
  /** The group row's own level — its block sits one deeper. */
  readonly level: number;
  readonly pathKey: string | undefined;
  readonly row: Record<string, unknown>;
};

const NOTHING: readonly DrilledEntry[] = [];

/**
 * The rows one group contributes below itself, each paired with its tree
 * metadata (ADR-079).
 *
 * **Rows and metadata are built together, and that pairing is the point.**
 * `TableBody` sizes `<tbody>` from `rows.length` and the focus model indexes
 * both arrays by the same number, so a row without its meta — or the reverse —
 * is a grid whose painted height and navigable extent disagree. Returning one
 * list of pairs makes them impossible to push out of step, where two
 * appends in a caller's loop were only conventionally in step.
 *
 * Extracted from `resolveTableGroupTree` because it is the whole of what the
 * drill added there: three guards and a nested loop, in a function that already
 * had a tree to walk.
 */
export const resolveDrilledBlock = ({
  drill,
  isCollapsed,
  isDrillable,
  level,
  pathKey,
  row,
}: ResolveDrilledBlockArgs): readonly DrilledEntry[] => {
  if (!isDrillable || pathKey === undefined) return NOTHING;

  const summary = getTableGroupRowSummary(row);

  if (summary === undefined) return NOTHING;

  const drilled = resolveDrilledRows({ drill, isCollapsed, pathKey, summary });

  return drilled.map((drilledRow, index) => ({
    meta: {
      hasChildren: false,
      isDrillable: false,
      isExpanded: false,
      // One level deeper than the group they were fetched for, and counted
      // among each other: they are a set of siblings under it, not members of
      // the group row's own set.
      level: level + 1,
      pathKey: undefined,
      posInSet: index + 1,
      setSize: drilled.length,
    },
    row: drilledRow,
  }));
};
