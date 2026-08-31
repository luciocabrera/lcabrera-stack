import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveCrudRowId } from './resolveCrudRowId.util';

type Row = {
  readonly order_id: number;
  readonly order_number: string;
};

const col = ({
  isPrimaryKey,
  key,
}: {
  readonly isPrimaryKey?: boolean;
  readonly key: keyof Row;
}): TableColumn<Row> => ({
  isPrimaryKey,
  key,
  label: key,
});

describe('resolveCrudRowId', () => {
  it('returns the raw encoded value for a single primary key', () => {
    const result = resolveCrudRowId<Row>({
      columns: [
        col({ isPrimaryKey: true, key: 'order_id' }),
        col({ key: 'order_number' }),
      ],
      row: { order_id: 123, order_number: 'ORD-9' },
    });

    expect(result).toBe('123');
  });

  it('joins encoded composite key values in declaration order', () => {
    const result = resolveCrudRowId<Row>({
      columns: [
        col({ isPrimaryKey: true, key: 'order_id' }),
        col({ isPrimaryKey: true, key: 'order_number' }),
      ],
      row: { order_id: 123, order_number: 'ORD 9' },
    });

    expect(result).toBe('123_ORD%209');
  });

  it('answers undefined when no primary-key column is declared', () => {
    expect(
      resolveCrudRowId<Row>({
        columns: [col({ key: 'order_id' }), col({ key: 'order_number' })],
        row: { order_id: 123, order_number: 'ORD-9' },
      }),
    ).toBeUndefined();
  });

  it('answers undefined when a primary-key value is neither string nor number', () => {
    expect(
      resolveCrudRowId<Row>({
        columns: [col({ isPrimaryKey: true, key: 'order_id' })],
        row: { order_id: undefined as unknown as number, order_number: 'x' },
      }),
    ).toBeUndefined();
  });

  it('answers undefined when only one half of a composite key resolves', () => {
    expect(
      resolveCrudRowId<Row>({
        columns: [
          col({ isPrimaryKey: true, key: 'order_id' }),
          col({ isPrimaryKey: true, key: 'order_number' }),
        ],
        row: { order_id: 123, order_number: undefined as unknown as string },
      }),
    ).toBeUndefined();
  });
});
