import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableCellPalette } from '#ui/components/Table/Table.types';

import { createTableRouteLoader } from './createTableRouteLoader.util';

type Row = { readonly id: number; readonly score: number };

const CELL_PALETTE: TableCellPalette = {
  caution: {
    dark: { background: '#553300', text: '#ffffff' },
    light: { background: '#ffcc66', text: '#222222' },
  },
};

const COLUMNS: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  {
    cell: { kind: 'badge', params: { rules: [{ gte: 1, tone: 'caution' }] } },
    dataType: 'number',
    key: 'score',
    label: 'Score',
  },
];

const load = async (cellPalette?: TableCellPalette) =>
  createTableRouteLoader<Row, { readonly data: readonly Row[] }>({
    appId: 'test-app',
    ...(cellPalette !== undefined && { cellPalette }),
    columns: COLUMNS,
    fetchPage: () => Promise.resolve({ data: [] }),
    persistenceKey: 'rows',
    tableName: 'rows',
    title: { plural: 'Rows', singular: 'Row' },
  })({ request: new Request('http://localhost/rows') } as LoaderFunctionArgs);

describe('createTableRouteLoader cell calls', () => {
  it('passes a column’s cell call through as plain data', async () => {
    const { columnsState } = await load(CELL_PALETTE);

    expect(columnsState.columns[1]?.cell).toEqual({
      kind: 'badge',
      params: { rules: [{ gte: 1, tone: 'caution' }] },
    });
    expect(() => structuredClone(columnsState)).not.toThrow();
  });

  it('sends the route’s palette beside the columns', async () => {
    const { columnsState } = await load(CELL_PALETTE);

    expect(columnsState.cellPalette).toBe(CELL_PALETTE);
  });

  it('sends no palette when the route declares none', async () => {
    const { columnsState } = await load();

    expect('cellPalette' in columnsState).toBe(false);
  });
});
