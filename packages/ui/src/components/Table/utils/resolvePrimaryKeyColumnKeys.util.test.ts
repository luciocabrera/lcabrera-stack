import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { resolvePrimaryKeyColumnKeys } from './resolvePrimaryKeyColumnKeys.util';

type Row = {
  readonly id: number;
  readonly name: string;
  readonly ref: string;
};

const column = ({
  isPrimaryKey,
  key,
}: {
  readonly isPrimaryKey?: boolean;
  readonly key: TableColumn<Row>['key'];
}): TableColumn<Row> => ({
  isPrimaryKey,
  key,
  label: key,
});

describe('resolvePrimaryKeyColumnKeys', () => {
  it('returns primary-key column keys in declaration order', () => {
    const result = resolvePrimaryKeyColumnKeys<Row>({
      columns: [
        column({ isPrimaryKey: true, key: 'id' }),
        column({ key: 'name' }),
        column({ isPrimaryKey: true, key: 'ref' }),
      ],
    });

    expect(result).toStrictEqual(['id', 'ref']);
  });

  it('returns an empty array when no column is a primary key', () => {
    const result = resolvePrimaryKeyColumnKeys<Row>({
      columns: [column({ key: 'id' }), column({ key: 'name' })],
    });

    expect(result).toStrictEqual([]);
  });

  it('ignores the synthetic actions column even if flagged', () => {
    const result = resolvePrimaryKeyColumnKeys<Row>({
      columns: [
        { isPrimaryKey: true, key: 'actions', label: 'Actions' },
        column({ isPrimaryKey: true, key: 'id' }),
      ],
    });

    expect(result).toStrictEqual(['id']);
  });
});
