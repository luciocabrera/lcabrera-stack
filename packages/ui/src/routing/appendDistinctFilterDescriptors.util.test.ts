import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';

type Row = {
  readonly amount: number;
  readonly name: string;
  readonly status: string;
  readonly vin: string;
};

const columns: readonly TableColumn<Row>[] = [
  { dataType: 'number', key: 'amount', label: 'Amount' },
  { dataType: 'string', key: 'name', label: 'Name' },
  {
    dataType: 'string',
    filterOptionsDescriptor: { kind: 'static', values: ['Open', 'Closed'] },
    key: 'status',
    label: 'Status',
  },
  { dataType: 'string', isFilterable: false, key: 'vin', label: 'VIN' },
];

describe('appendDistinctFilterDescriptors', () => {
  it('attaches baked distinct descriptors to filterable string columns only', () => {
    const result = appendDistinctFilterDescriptors({
      columns,
      schemaName: 'public',
      tableName: 'orders',
      transport: 'bff',
    });

    expect(result[1]?.filterOptionsDescriptor).toEqual({
      kind: 'distinct',
      params: {
        columnName: 'name',
        schemaName: 'public',
        tableName: 'orders',
      },
      transport: 'bff',
    });
  });

  it('leaves non-string, opted-out, and already-described columns untouched', () => {
    const result = appendDistinctFilterDescriptors({
      columns,
      schemaName: 'public',
      tableName: 'orders',
      transport: 'loader',
    });

    expect(result[0]).toBe(columns[0]);
    expect(result[3]).toBe(columns[3]);
    expect(result[2]?.filterOptionsDescriptor).toEqual({
      kind: 'static',
      values: ['Open', 'Closed'],
    });
  });

  it('omits schemaName from params when not provided', () => {
    const result = appendDistinctFilterDescriptors({
      columns,
      tableName: 'orders',
      transport: 'loader',
    });

    expect(result[1]?.filterOptionsDescriptor).toEqual({
      kind: 'distinct',
      params: { columnName: 'name', tableName: 'orders' },
      transport: 'loader',
    });
  });

  it('produces no function members anywhere (loader-boundary safe)', () => {
    const result = appendDistinctFilterDescriptors({
      columns,
      schemaName: 'public',
      tableName: 'orders',
      transport: 'bff',
    });

    const hasFunction = result.some((column) =>
      Object.values(column).some((member) => typeof member === 'function'),
    );
    expect(hasFunction).toBe(false);
  });
});
