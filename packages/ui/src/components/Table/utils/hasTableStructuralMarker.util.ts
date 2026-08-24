import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';

/**
 * True when the row carries `TABLE_GROUP_ROW_FIELD`, even if the payload is malformed.
 * `getTableGroupRowSummary` returns `undefined` for a malformed member, which looks like
 * an ordinary data row — and that handed the row to the detail path, where
 * `resolveCrudRowId` threw (ADR-062). Presence of the field is the honest test: a
 * malformed group row is still a group row.
 */
export const hasTableStructuralMarker = (row: Record<string, unknown>) =>
  Object.hasOwn(row, TABLE_GROUP_ROW_FIELD);
