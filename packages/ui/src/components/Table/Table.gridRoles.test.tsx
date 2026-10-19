// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';

type TestRow = Record<string, unknown>;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
];

const rows: readonly TestRow[] = [
  { city: 'Lisbon', id: 1 },
  { city: 'Porto', id: 2 },
  { city: 'Faro', id: 3 },
];

afterEach(cleanup);

const renderGrid = () =>
  render(<GroupedTableTestShell columns={columns} data={rows} />);

describe('Table grid roles', () => {
  it('exposes the populated body as a rowgroup owned by the grid', () => {
    renderGrid();

    const rowgroups = within(screen.getByRole('grid')).getAllByRole('rowgroup');

    expect(rowgroups).toHaveLength(1);
    expect(rowgroups[0]?.getAttribute('role')).toBe('rowgroup');
  });

  it('exposes every data row as a row owned by the body rowgroup', () => {
    renderGrid();

    const bodyRows = within(screen.getByRole('rowgroup')).getAllByRole('row');

    expect(bodyRows).toHaveLength(rows.length);
    expect(bodyRows.map((row) => row.getAttribute('role'))).toStrictEqual(
      rows.map(() => 'row'),
    );
  });
});
