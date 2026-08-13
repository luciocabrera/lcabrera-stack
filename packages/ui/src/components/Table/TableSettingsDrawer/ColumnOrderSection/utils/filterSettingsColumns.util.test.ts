import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { createGroupHierarchyColumn } from '#ui/components/Table/utils/createGroupHierarchyColumn.util';

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

  it('drops the grid-owned hierarchy column, static though it is', () => {
    // Spelled from the column the grid actually injects rather than by hand:
    // it is static, so the `isStatic` arm above would list it — locked in
    // place, but listed — and there is nothing a user can do to it (ADR-065).
    const hierarchyColumn = createGroupHierarchyColumn<Row>({
      columns,
      groupingKeys: ['name'],
    });

    expect(
      filterSettingsColumns<Row>([hierarchyColumn, ...columns]).map(
        (col) => col.key,
      ),
    ).toStrictEqual(['id', 'name']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterSettingsColumns<Row>([])).toEqual([]);
  });
});
