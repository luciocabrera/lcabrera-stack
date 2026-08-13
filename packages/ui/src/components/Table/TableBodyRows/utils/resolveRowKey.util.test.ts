import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

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

const groupRow = (...labels: readonly string[]) =>
  ({
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      isSubtotal: false,
      path: labels.map((label, index) => ({
        columnKey: index === 0 ? 'order_number' : `key_${index}`,
        label,
      })),
    },
  }) as unknown as Row;

const singleKeyColumns = [
  col({ isPrimaryKey: true, key: 'order_id' }),
  col({ key: 'order_number' }),
];

const compositeKeyColumns = [
  col({ isPrimaryKey: true, key: 'order_id' }),
  col({ isPrimaryKey: true, key: 'order_number' }),
];

const UNRESOLVABLE_VALUE = undefined as unknown as Row['order_id'];

/** Half of a surrogate pair — `encodeURIComponent` raises `URIError` on it. */
const LONE_SURROGATE = '\u{D800}';

describe('resolveRowKey', () => {
  it('derives the key from a single primary-key column', () => {
    const result = resolveRowKey<Row>({
      columns: singleKeyColumns,
      index: 7,
      row: { order_id: 123, order_number: 'ORD-9' },
    });

    expect(result).toBe('pk:[123]');
  });

  it('encodes composite key values in declaration order', () => {
    const result = resolveRowKey<Row>({
      columns: compositeKeyColumns,
      index: 0,
      row: { order_id: 123, order_number: 'ORD 9' },
    });

    expect(result).toBe('pk:[123,"ORD 9"]');
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
      columns: compositeKeyColumns,
      index: 6,
      row: { order_id: 123, order_number: UNRESOLVABLE_VALUE as string },
    });

    expect(result).toBe('idx:6');
  });

  it('falls back to the index for a non-finite numeric id', () => {
    const columns = [col({ isPrimaryKey: true, key: 'order_id' })];

    expect(
      resolveRowKey<Row>({
        columns,
        index: 8,
        row: { order_id: NaN, order_number: 'ORD-9' },
      }),
    ).toBe('idx:8');
    expect(
      resolveRowKey<Row>({
        columns,
        index: 9,
        row: { order_id: Infinity, order_number: 'ORD-9' },
      }),
    ).toBe('idx:9');
    expect(
      resolveRowKey<Row>({
        columns,
        index: 10,
        row: { order_id: -Infinity, order_number: 'ORD-9' },
      }),
    ).toBe('idx:10');
  });

  it('escapes an unpaired surrogate instead of throwing', () => {
    const args = {
      columns: [col({ isPrimaryKey: true, key: 'order_id' })],
      index: 0,
      row: { order_id: LONE_SURROGATE, order_number: 'ORD-9' },
    };

    expect(() => resolveRowKey<Row>(args)).not.toThrow();
    expect(resolveRowKey<Row>(args)).toBe(String.raw`pk:["\ud800"]`);
  });

  it('keeps a composite key unambiguous across element boundaries', () => {
    const splitEarly = resolveRowKey<Row>({
      columns: compositeKeyColumns,
      index: 0,
      row: { order_id: 'a_b', order_number: 'c' },
    });
    const splitLate = resolveRowKey<Row>({
      columns: compositeKeyColumns,
      index: 1,
      row: { order_id: 'a', order_number: 'b_c' },
    });

    expect(splitEarly).not.toBe(splitLate);

    const quotedEarly = resolveRowKey<Row>({
      columns: compositeKeyColumns,
      index: 2,
      row: { order_id: 'a"', order_number: 'b' },
    });
    const quotedLate = resolveRowKey<Row>({
      columns: compositeKeyColumns,
      index: 3,
      row: { order_id: 'a', order_number: '"b' },
    });

    expect(quotedEarly).not.toBe(quotedLate);
  });

  it('distinguishes a numeric id from the same id as text', () => {
    const columns = [col({ isPrimaryKey: true, key: 'order_id' })];

    expect(
      resolveRowKey<Row>({
        columns,
        index: 0,
        row: { order_id: 7, order_number: 'ORD-1' },
      }),
    ).not.toBe(
      resolveRowKey<Row>({
        columns,
        index: 1,
        row: { order_id: '7', order_number: 'ORD-2' },
      }),
    );
  });

  it('gives each unresolvable row a distinct key', () => {
    const columns = [col({ key: 'order_id' }), col({ key: 'order_number' })];
    const row: Row = { order_id: 1, order_number: 'ORD-9' };

    expect(resolveRowKey<Row>({ columns, index: 0, row })).not.toBe(
      resolveRowKey<Row>({ columns, index: 1, row }),
    );
  });

  it('keeps value-derived and index-derived keys in disjoint namespaces', () => {
    const valueDerived = resolveRowKey<Row>({
      columns: singleKeyColumns,
      index: 0,
      row: { order_id: '3', order_number: 'ORD-1' },
    });
    const indexDerived = resolveRowKey<Row>({
      columns: singleKeyColumns,
      index: 3,
      row: { order_id: UNRESOLVABLE_VALUE, order_number: 'ORD-2' },
    });

    expect(valueDerived).toBe('pk:["3"]');
    expect(indexDerived).toBe('idx:3');
    expect(valueDerived.startsWith('pk:')).toBe(true);
    expect(indexDerived.startsWith('idx:')).toBe(true);
    expect(valueDerived).not.toBe(indexDerived);
  });

  describe('group rows', () => {
    it('derives a group row key from its own values, not from its index', () => {
      // A grouped read projects the group key and its aggregates, so the
      // primary-key branch would find nothing and fall through to the index —
      // giving every group in the result the identity of its position.
      expect(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 0,
          row: groupRow('ORD-1'),
        }),
      ).toBe(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 7,
          row: groupRow('ORD-1'),
        }),
      );
    });

    it('gives different groups different keys', () => {
      expect(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 0,
          row: groupRow('ORD-1'),
        }),
      ).not.toBe(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 0,
          row: groupRow('ORD-2'),
        }),
      );
    });

    it('keeps group keys in a namespace disjoint from both others', () => {
      const groupDerived = resolveRowKey<Row>({
        columns: singleKeyColumns,
        index: 0,
        row: groupRow('3'),
      });

      expect(groupDerived.startsWith('grp:')).toBe(true);
      expect(groupDerived.startsWith('pk:')).toBe(false);
      expect(groupDerived.startsWith('idx:')).toBe(false);
    });

    it('identifies a multi-key group by its whole path, not by one level', () => {
      // Under multi-key grouping the outermost key repeats across every group
      // beneath it, so a key derived from one level would hand every sibling
      // the same identity.
      expect(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 0,
          row: groupRow('ORD-1', 'USA'),
        }),
      ).not.toBe(
        resolveRowKey<Row>({
          columns: singleKeyColumns,
          index: 0,
          row: groupRow('ORD-1', 'CAN'),
        }),
      );
    });

    it('ignores a malformed summary and falls back to the ordinary derivation', () => {
      const row = {
        order_id: 5,
        order_number: 'ORD-1',
        [TABLE_GROUP_ROW_FIELD]: { label: 'ORD-1' },
      } as unknown as Row;

      expect(
        resolveRowKey<Row>({ columns: singleKeyColumns, index: 0, row }),
      ).toBe('pk:[5]');
    });
  });
});
