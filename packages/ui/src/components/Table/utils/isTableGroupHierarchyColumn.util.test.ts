import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '../Table.constants';
import { isTableGroupHierarchyColumn } from './isTableGroupHierarchyColumn.util';

describe('isTableGroupHierarchyColumn', () => {
  it('recognises the grid-owned hierarchy column', () => {
    expect(isTableGroupHierarchyColumn(TABLE_GROUP_HIERARCHY_COLUMN_KEY)).toBe(
      true,
    );
  });

  it('refuses a data column, however close the name', () => {
    expect(isTableGroupHierarchyColumn('tableGroup')).toBe(false);
    expect(isTableGroupHierarchyColumn('hierarchy')).toBe(false);
  });

  it('refuses a missing key rather than answering yes', () => {
    expect(isTableGroupHierarchyColumn(undefined)).toBe(false);
  });
});
