import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { toStaticGroupTree } from './toStaticGroupTree.util';

const groupRow = {
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 1,
    isSubtotal: false,
    path: [{ columnKey: 'city', label: 'Paris', value: 'Paris' }],
  },
};

describe('toStaticGroupTree', () => {
  it('returns every row as given, with no row metadata to fold by', () => {
    const rows = [groupRow, { id: 1 }, { id: 2 }];
    const tree = toStaticGroupTree(rows);

    expect(tree.rows).toBe(rows);
    expect(tree.rowMeta).toBeUndefined();
    expect(tree.foldableGroupPaths.size).toBe(0);
  });

  it('still reports whether the rows carry a group', () => {
    expect(toStaticGroupTree([groupRow, { id: 1 }]).isTreeGrid).toBe(true);
    expect(toStaticGroupTree([{ id: 1 }]).isTreeGrid).toBe(false);
  });
});
