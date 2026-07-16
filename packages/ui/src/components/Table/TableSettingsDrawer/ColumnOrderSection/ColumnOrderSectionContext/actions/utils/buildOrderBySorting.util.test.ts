import { describe, expect, it } from 'vitest';

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
});
