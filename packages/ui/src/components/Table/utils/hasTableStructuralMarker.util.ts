import {
  TABLE_DRILL_ROW_FIELD,
  TABLE_GROUP_ROW_FIELD,
} from '../Table.constants';

/**
 * Whether a row **claims** to be grid chrome, asked without narrowing it.
 *
 * `getTableGroupRowSummary` and `getTableDrillRow` answer a different question:
 * whether the row's marker is well-formed enough to render from. Both return
 * `undefined` when it is not, and that answer is indistinguishable from "this
 * is an ordinary data row" — so a group row with one malformed member was
 * handed to the detail-row path, where the actions column asked it for a
 * primary key it was never going to have and `resolveCrudRowId` threw during
 * render, emptying the table (ADR-062).
 *
 * The presence of the field is the honest test for "is this a data row", and it
 * cannot fail: a malformed group row is still a group row. Keeping the two
 * questions separate is what lets the narrowing validators stay strict — one
 * member that does not narrow must still refuse the whole summary, because a
 * group described by some of its keys is not the group the row holds — without
 * that strictness turning into a reclassification.
 */
export const hasTableStructuralMarker = (row: Record<string, unknown>) =>
  Object.hasOwn(row, TABLE_GROUP_ROW_FIELD) ||
  Object.hasOwn(row, TABLE_DRILL_ROW_FIELD);
