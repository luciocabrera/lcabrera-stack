import { describe, expect, it } from 'vitest';

import type { TableColumn } from '../Table.types.ts';

import { syncColumnOrderWithPinning } from './syncColumnOrderWithPinning.util.ts';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { dataType: 'string', key: 'actions', label: 'Actions' },
];

describe('syncColumnOrderWithPinning', () => {
  it('returns currentOrder unchanged when columnPinning is undefined', () => {
    const currentOrder = ['id', 'name', 'age', 'actions'];
    const result = syncColumnOrderWithPinning({
      columnKey: 'name',
      columnPinning: undefined,
      columns,
      currentOrder,
      newPinning: { left: [], right: [] },
    });
    expect(result).toEqual(currentOrder);
  });

  it('inserts column after existing left-pinned columns when pinning left', () => {
    const result = syncColumnOrderWithPinning({
      columnKey: 'name',
      columnPinning: 'left',
      columns,
      currentOrder: ['id', 'name', 'age', 'actions'],
      newPinning: { left: ['id', 'name'], right: [] },
    });
    expect(result[1]).toBe('name');
  });

  it('inserts column before existing right-pinned columns when pinning right', () => {
    const result = syncColumnOrderWithPinning({
      columnKey: 'age',
      columnPinning: 'right',
      columns,
      currentOrder: ['id', 'name', 'age', 'actions'],
      newPinning: { left: [], right: ['age', 'actions'] },
    });
    expect(result[2]).toBe('age');
  });

  it('derives base order from columns when currentOrder is empty', () => {
    const result = syncColumnOrderWithPinning({
      columnKey: 'id',
      columnPinning: 'left',
      columns,
      currentOrder: [],
      newPinning: { left: ['id'], right: [] },
    });
    expect(result[0]).toBe('id');
  });
});
