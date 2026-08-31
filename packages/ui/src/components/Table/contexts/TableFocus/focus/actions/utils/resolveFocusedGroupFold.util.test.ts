import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

import { resolveFocusedGroupFold } from './resolveFocusedGroupFold.util';

const PARIS: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Paris', value: 'Paris' },
];
const MARAIS: readonly TableGroupKeyValue[] = [
  ...PARIS,
  { columnKey: 'district', label: 'Marais', value: 'Marais' },
];

const metaOf = (
  overrides: Partial<TableGroupTreeRowMeta> = {},
): TableGroupTreeRowMeta => ({
  hasChildren: false,
  isExpanded: false,
  level: 2,
  levelDisclosures: [],
  pathKey: 'grp:marais',
  posInSet: 1,
  setSize: 1,
  ...overrides,
});

describe('resolveFocusedGroupFold', () => {
  it('acts on the level the focused column holds', () => {
    const fold = resolveFocusedGroupFold({
      columnKey: 'city',
      groupPath: MARAIS,
      meta: metaOf({
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: PARIS },
        ],
      }),
    });

    expect(fold.path).toStrictEqual(PARIS);
    expect(fold.hasChildren).toBe(true);
    expect(fold.isExpanded).toBe(true);
  });

  it('offers nothing from a key cell that deliberately draws no chevron', () => {
    const fold = resolveFocusedGroupFold({
      columnKey: 'district',
      groupPath: MARAIS,
      meta: metaOf({
        hasChildren: true,
        isExpanded: true,
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: PARIS },
        ],
      }),
    });

    expect(fold.hasChildren).toBe(false);
  });

  it('keeps the row-scoped keys on a column that holds no level at all', () => {
    const fold = resolveFocusedGroupFold({
      columnKey: 'unrelated',
      groupPath: MARAIS,
      meta: metaOf({
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: PARIS },
        ],
      }),
    });

    expect(fold.path).toStrictEqual(MARAIS);
  });

  it('falls back to the row when nothing has focus in a column', () => {
    const fold = resolveFocusedGroupFold({
      columnKey: undefined,
      groupPath: MARAIS,
      meta: metaOf({ hasChildren: true, isExpanded: true }),
    });

    expect(fold.path).toStrictEqual(MARAIS);
    expect(fold.hasChildren).toBe(true);
  });

  it('offers nothing to fold on a detail row', () => {
    expect(
      resolveFocusedGroupFold({
        columnKey: 'city',
        groupPath: undefined,
        meta: undefined,
      }),
    ).toStrictEqual({
      hasChildren: false,
      isExpanded: false,
      path: undefined,
    });
  });
});
