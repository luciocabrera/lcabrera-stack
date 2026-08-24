import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

type ResolveCarriedGroupKeysArgs = {
  /**
   * Whether this row is the first one the virtualization window paints.
   *
   * The window's first row has no row above it **on screen**, so a level
   * carried from a row that was scrolled past would be stated nowhere. It
   * refills instead (ADR-080). This is the one input that comes from the
   * painted list; everything else is read off the loaded array, which is what
   * keeps the answer stable as the window moves.
   */
  readonly isWindowFirst: boolean;
  /** The loaded row directly above — **not** the painted one. */
  readonly previousRow: Record<string, unknown> | undefined;
  readonly summary: TableGroupRowSummary | undefined;
};

const NOTHING_CARRIED: ReadonlySet<string> = new Set();

/**
 * Which of a group row's key columns repeat the row above and so render blank.
 *
 * An ancestor is carried rather than restated: with one column per key, a run
 * of siblings would otherwise repeat every level on every row, which is the
 * noise the hierarchy column's indentation used to avoid.
 *
 * **The row's own innermost level is never carried**, so every group row states
 * something. That is also what keeps the disclosure chevron on a drawn cell.
 *
 * **A detail row above refills the run.** A detail row has no path, so nothing
 * above states the level — "changes from the row above" is true by default, and
 * the group row after a block of detail rows restates its ancestry with no rule
 * of its own.
 *
 * The walk stops at the first level that differs, because equality below a
 * changed ancestor is coincidence — two `Accessories` under different
 * categories are different groups, and blanking the second would say they were
 * the same one.
 */
export const resolveCarriedGroupKeys = ({
  isWindowFirst,
  previousRow,
  summary,
}: ResolveCarriedGroupKeysArgs): ReadonlySet<string> => {
  if (isWindowFirst || summary === undefined || previousRow === undefined)
    return NOTHING_CARRIED;

  const previousSummary = getTableGroupRowSummary(previousRow);

  if (previousSummary === undefined) return NOTHING_CARRIED;

  const carried = new Set<string>();

  // `length - 1` rather than `length`: the innermost level always draws.
  for (let level = 0; level < summary.path.length - 1; level += 1) {
    const entry = summary.path[level];
    const previousEntry = previousSummary.path[level];

    if (entry === undefined || previousEntry === undefined) break;
    if (entry.columnKey !== previousEntry.columnKey) break;
    if (entry.label !== previousEntry.label) break;

    carried.add(entry.columnKey);
  }

  return carried;
};
