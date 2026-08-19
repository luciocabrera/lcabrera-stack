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
  isDrillable: false,
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
    // The keyboard has to fold what the chevron in the same cell folds, or the
    // two paths disagree on every row that states an ancestor (#802).
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
    // An open subtotal skips its own level, so its innermost key cell renders
    // blank space. Folding from there with the keyboard would collapse the
    // group from the one cell whose emptiness says it cannot — and would
    // contradict the contract that the keyboard matches the chevron.
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
    expect(fold.isDrillable).toBe(false);
  });

  it('still answers the drill from a drillable leaf’s innermost key cell', () => {
    // A drillable leaf owns no loaded children, so it has no level entry by
    // construction — the fallback is the drill, and it must survive the rule
    // above (ADR-079).
    const fold = resolveFocusedGroupFold({
      columnKey: 'district',
      groupPath: MARAIS,
      meta: metaOf({ isDrillable: true }),
    });

    expect(fold.isDrillable).toBe(true);
    expect(fold.path).toStrictEqual(MARAIS);
  });

  it('keeps the row-scoped keys on a column that holds no level at all', () => {
    // An aggregate column is not a key column, so the question of *which* level
    // cannot arise there and the treegrid's row-scoped keys still apply.
    const fold = resolveFocusedGroupFold({
      columnKey: 'unrelated',
      groupPath: MARAIS,
      meta: metaOf({
        isDrillable: true,
        levelDisclosures: [
          { columnKey: 'city', isExpanded: true, path: PARIS },
        ],
      }),
    });

    expect(fold.path).toStrictEqual(MARAIS);
    expect(fold.isDrillable).toBe(true);
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
      isDrillable: false,
      isExpanded: false,
      path: undefined,
    });
  });
});
