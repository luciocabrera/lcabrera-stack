import type {
  TableDrillRow,
  TableDrillRowKind,
  TableGroupDrill,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_DRILL_ROW_FIELD } from '#ui/components/Table/Table.constants';

type ChromeRowArgs = {
  readonly kind: TableDrillRowKind;
  readonly path: TableGroupRowSummary['path'];
  readonly pathKey: string;
  readonly shortfall: number;
};

type ResolveDrilledRowsArgs = {
  readonly drill: TableGroupDrill | undefined;
  readonly isCollapsed: boolean;
  readonly pathKey: string;
  readonly summary: TableGroupRowSummary;
};

const chromeRow = ({
  kind,
  path,
  pathKey,
  shortfall,
}: ChromeRowArgs): TableDrillRow => ({
  [TABLE_DRILL_ROW_FIELD]: { kind, path, pathKey, shortfall },
});

const NOTHING: readonly Record<string, unknown>[] = [];

/**
 * The rows that follow one group row because it was drilled — its page, and the
 * one grid-created row that says what happened (ADR-079).
 *
 * **A drill is opt-in, and the collapsed set cannot express that.** Expansion is
 * held by its complement (ADR-067), so a group nobody has touched is expanded,
 * and a leaf treated as expanded-therefore-drilled would fetch every group on
 * the grid the moment it rendered. What gates a drill is the presence of an
 * entry in `drilledGroups`: absent means nobody asked.
 *
 * Collapsing a drilled group **keeps its entry**, so re-expanding it costs no
 * second request — which is also why the two pieces of state are separate rather
 * than one tri-state. `loaded` is terminal (ADR-079) and a collapse must not
 * quietly un-terminate it.
 *
 * **Every state contributes exactly one chrome row, or none.** `loading` and
 * `failed` are a single row each; `loaded` is the page plus a hand-off **only**
 * where the group holds more rows than the page fetched. That last condition is
 * `summary.count` against the page length, and the group is the one that knows
 * its own count — recomputing it from the rows would answer the wrong question,
 * since the rows are the ones that arrived.
 */
export const resolveDrilledRows = ({
  drill,
  isCollapsed,
  pathKey,
  summary,
}: ResolveDrilledRowsArgs): readonly Record<string, unknown>[] => {
  if (drill === undefined || isCollapsed) return NOTHING;

  if (drill.status !== 'loaded')
    return [
      chromeRow({
        kind: drill.status,
        path: summary.path,
        pathKey,
        shortfall: 0,
      }),
    ];

  const shortfall = summary.count - drill.rows.length;

  return shortfall > 0
    ? [
        ...drill.rows,
        chromeRow({ kind: 'handoff', path: summary.path, pathKey, shortfall }),
      ]
    : drill.rows;
};
