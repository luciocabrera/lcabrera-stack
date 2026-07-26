import { describe, expect, it } from 'vite-plus/test';

import { buildOrderBySorting } from './buildOrderBySorting.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

describe('buildOrderBySorting', () => {
  it('moves sorted columns to the beginning in sorting order', () => {
    const result = buildOrderBySorting<Row>({
      columnOrder: ['id', 'name', 'age'],
      sorting: [
        { columnKey: 'age', direction: 'asc' },
        { columnKey: 'name', direction: 'desc' },
      ],
      staticKeys: new Set<string>(),
    });

    expect(result).toEqual(['age', 'name', 'id']);
  });

  it('keeps static columns in their original position', () => {
    const result = buildOrderBySorting<Row>({
      columnOrder: ['id', 'name', 'age'],
      sorting: [{ columnKey: 'age', direction: 'asc' }],
      staticKeys: new Set<string>(['id']),
    });

    expect(result).toEqual(['id', 'age', 'name']);
  });

  // A sort can outlive the column's presence in the order list, because
  // `sorting` and `columnOrder` are read from state independently. Before these
  // cases the outcome depended on whether the absent column happened to be
  // static: a plain one was prepended into the persisted order, a static one was
  // dropped by `restoreStaticColumnOrder`, which had no position to return it
  // to. All of them now agree, and none ever reached the DOM —
  // `getEffectiveColumns` drops an order entry that resolves to no column.
  describe('a sort naming a column absent from columnOrder', () => {
    it('is ignored rather than prepended', () => {
      expect(
        buildOrderBySorting<Row>({
          columnOrder: ['id', 'name'],
          sorting: [{ columnKey: 'age', direction: 'asc' }],
          staticKeys: new Set<string>(),
        }),
      ).toEqual(['id', 'name']);
    });

    it('is ignored when an unrelated column is static', () => {
      expect(
        buildOrderBySorting<Row>({
          columnOrder: ['id', 'name'],
          sorting: [{ columnKey: 'age', direction: 'asc' }],
          staticKeys: new Set<string>(['id']),
        }),
      ).toEqual(['id', 'name']);
    });

    it('is ignored when the absent column is itself static', () => {
      expect(
        buildOrderBySorting<Row>({
          columnOrder: ['id', 'name'],
          sorting: [{ columnKey: 'age', direction: 'asc' }],
          staticKeys: new Set<string>(['age']),
        }),
      ).toEqual(['id', 'name']);
    });

    it('still orders the sorts that do name present columns', () => {
      expect(
        buildOrderBySorting<Row>({
          columnOrder: ['id', 'name'],
          sorting: [
            { columnKey: 'age', direction: 'asc' },
            { columnKey: 'name', direction: 'desc' },
          ],
          staticKeys: new Set<string>(),
        }),
      ).toEqual(['name', 'id']);
    });
  });
});
