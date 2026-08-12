import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveRowKey } from './resolveRowKey.util';

type Row = {
  readonly order_id: number | string;
  readonly order_number: string;
};

const col = ({
  isPrimaryKey,
  key,
}: {
  readonly isPrimaryKey?: boolean;
  readonly key: 'actions' | keyof Row;
}): TableColumn<Row> => ({
  isPrimaryKey,
  key,
  label: key,
});

const UNRESOLVABLE_VALUE = undefined as unknown as Row['order_id'];

describe('resolveRowKey', () => {
  it('derives the key from a single primary-key column', () => {
    const result = resolveRowKey<Row>({
      columns: [
        col({ isPrimaryKey: true, key: 'order_id' }),
        col({ key: 'order_number' }),
      ],
      index: 7,
      row: { order_id: 123, order_number: 'ORD-9' },
    });

    expect(result).toBe('pk:123');
  });

  it('joins encoded composite key values in declaration order', () => {
    const result = resolveRowKey<Row>({
      columns: [
        col({ isPrimaryKey: true, key: 'order_id' }),
        col({ isPrimaryKey: true, key: 'order_number' }),
      ],
      index: 0,
      row: { order_id: 123, order_number: 'ORD 9' },
    });

    expect(result).toBe('pk:123_ORD%209');
  });

  it('ignores a primary-key flag on the synthetic actions column', () => {
    const result = resolveRowKey<Row>({
      columns: [col({ isPrimaryKey: true, key: 'actions' })],
      index: 4,
      row: { order_id: 123, order_number: 'ORD-9' },
    });

    expect(result).toBe('idx:4');
  });

  it('falls back to the index when no column is a primary key', () => {
    const result = resolveRowKey<Row>({
      columns: [col({ key: 'order_id' }), col({ key: 'order_number' })],
      index: 2,
      row: { order_id: 123, order_number: 'ORD-9' },
    });

    expect(result).toBe('idx:2');
  });

  it('falls back to the index when a primary-key value is not a scalar', () => {
    const result = resolveRowKey<Row>({
      columns: [col({ isPrimaryKey: true, key: 'order_id' })],
      index: 5,
      row: { order_id: UNRESOLVABLE_VALUE, order_number: 'ORD-9' },
    });

    expect(result).toBe('idx:5');
  });

  it('falls back to the index when only part of a composite key resolves', () => {
    const result = resolveRowKey<Row>({
      columns: [
        col({ isPrimaryKey: true, key: 'order_id' }),
        col({ isPrimaryKey: true, key: 'order_number' }),
      ],
      index: 6,
      row: { order_id: 123, order_number: UNRESOLVABLE_VALUE as string },
    });

    expect(result).toBe('idx:6');
  });

  it('gives each unresolvable row a distinct key', () => {
    const columns = [col({ key: 'order_id' }), col({ key: 'order_number' })];
    const row: Row = { order_id: 1, order_number: 'ORD-9' };

    expect(resolveRowKey<Row>({ columns, index: 0, row })).not.toBe(
      resolveRowKey<Row>({ columns, index: 1, row }),
    );
  });

  it('cannot collide a value-derived key with the index-derived key of the same text', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ key: 'order_number' }),
    ];

    const valueDerived = resolveRowKey<Row>({
      columns,
      index: 0,
      row: { order_id: '3', order_number: 'ORD-1' },
    });
    const indexDerived = resolveRowKey<Row>({
      columns,
      index: 3,
      row: { order_id: UNRESOLVABLE_VALUE, order_number: 'ORD-2' },
    });

    expect(valueDerived).toBe('pk:3');
    expect(indexDerived).toBe('idx:3');
    expect(valueDerived).not.toBe(indexDerived);
  });
});
