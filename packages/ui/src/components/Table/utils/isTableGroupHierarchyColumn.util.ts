import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '../Table.constants';

/**
 * Whether a column key names the grid-owned hierarchy column (ADR-065).
 *
 * The comparison lives here rather than being spelled at each surface, because
 * the surfaces disagreeing is the whole failure mode: the column has to be in
 * the rendered partition and out of the settings list at the same time, and a
 * key compared in one place but not the other ships a drawer row for a column
 * the user cannot act on.
 */
export const isTableGroupHierarchyColumn = (columnKey: unknown) =>
  columnKey === TABLE_GROUP_HIERARCHY_COLUMN_KEY;
