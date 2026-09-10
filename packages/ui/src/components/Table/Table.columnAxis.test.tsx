// @vitest-environment jsdom

import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { groupedColumnAxisFixture } from '#ui/utils/tests/groupedColumnAxisFixture.util';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';
import { renderGroupedTableRoute } from '#ui/utils/tests/renderGroupedTableRoute.util';

const Harness = () => (
  <NotificationProvider>
    <GroupedTableTestShell
      columns={groupedColumnAxisFixture.columns}
      data={groupedColumnAxisFixture.rows}
      groupingState={{
        aggregates: groupedColumnAxisFixture.aggregates,
        columnAxis: groupedColumnAxisFixture.columnAxis,
        keys: groupedColumnAxisFixture.groupingKeys,
      }}
      header={<TableHeader />}
    />
  </NotificationProvider>
);

const headerLabels = () =>
  screen.getAllByTestId('table-header-label').map((el) => el.textContent);

describe('a grouped grid with a column axis', () => {
  afterEach(cleanup);

  it('paints unique axis values as headers with the measure in the cells', async () => {
    renderGroupedTableRoute(<Harness />);

    await waitFor(() => {
      expect(headerLabels()).toStrictEqual([
        'Customer Type',
        'Pending',
        'Shipped',
      ]);
    });

    expect(screen.getByTestId('table-group-header-row').textContent).toBe(
      'Business100250',
    );
  });
});
