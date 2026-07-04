import { describe, expect, it } from 'vitest';

import type { TableColumn } from '../Table.types';

import { syncColumnOrderWithPinning } from './syncColumnOrderWithPinning.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { dataType: 'string', key: 'actions', label: 'Actions' },
];

describe('syncColumnOrderWithPinning', () => {
  it('repositions a previously left-pinned column next to remaining left-pinned columns when unpinning', () => {
    const result = syncColumnOrderWithPinning({
      columnKey: 'age',
      columnPinning: undefined,
      columns,
      currentOrder: ['age', 'id', 'name', 'actions'],
      newPinning: { left: ['id'], right: [] },
      previousPinning: { left: ['id', 'age'], right: [] },
    });
    expect(result).toEqual(['id', 'age', 'name', 'actions']);
  });

  it('repositions a previously right-pinned column next to remaining right-pinned columns when unpinning', () => {
    const result = syncColumnOrderWithPinning({
      columnKey: 'name',
      columnPinning: undefined,
      columns,
      currentOrder: ['id', 'age', 'actions', 'name'],
      newPinning: { left: [], right: ['actions'] },
      previousPinning: { left: [], right: ['name', 'actions'] },
    });
    expect(result).toEqual(['id', 'age', 'name', 'actions']);
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
