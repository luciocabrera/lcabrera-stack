import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { filterSettingsColumns } from './filterSettingsColumns.util';

type Row = { actions: string; id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', isStatic: true, key: 'name', label: 'Name' },
  {
    dataType: 'string',
    key: 'actions',
    label: 'Actions',
    render: () => 'cell',
  },
];

describe('filterSettingsColumns', () => {
  it('keeps data columns without a custom render', () => {
    const result = filterSettingsColumns(columns);
    expect(result.map((c) => c.key)).toContain('id');
  });

  it('drops render columns unless they are static', () => {
    const result = filterSettingsColumns(columns);
    expect(result.map((c) => c.key)).toEqual(['id', 'name']);
  });

  it('keeps static columns even when they have a custom render', () => {
    const staticRenderColumn: TableColumn<Row> = {
      dataType: 'string',
      isStatic: true,
      key: 'actions',
      label: 'Actions',
      render: () => 'cell',
    };
    const result = filterSettingsColumns([staticRenderColumn]);
    expect(result.map((c) => c.key)).toEqual(['actions']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterSettingsColumns<Row>([])).toEqual([]);
  });
});
