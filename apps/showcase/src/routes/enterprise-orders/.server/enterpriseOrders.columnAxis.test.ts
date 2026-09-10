import type { TableGroupingState } from '@lcabrera/ui/components/Table/Table.types';

import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

import { selectOrdersPage } from './enterpriseOrders.service';

vi.mock('@lcabrera/server/db/delete-rows.util', () => ({
  deleteRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-column-grouping-capabilities.util', () => ({
  getColumnGroupingCapabilities: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-max-value.util', () => ({
  getMaxValue: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));
vi.mock('@lcabrera/server/db/insert-row.util', () => ({ insertRow: vi.fn() }));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/update-rows.util', () => ({
  updateRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/select-grouped-rows.util', () => ({
  selectGroupedRows: vi.fn(),
}));

const groupedReadWithoutRows = {
  aggregates: [{ alias: 'count_rows', fn: 'count' as const }],
  estimate: { kind: 'known' as const, rows: 0 },
  groupingSetMasks: [0],
  keys: ['customer_type'],
  maskAlias: 'group_mask' as const,
  rows: [],
  truncations: {},
};

const axisGrouping = (columnAxis?: string): TableGroupingState => ({
  aggregates: [],
  keys: ['customer_type'],
  mode: 'flat',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
  ...(columnAxis !== undefined && { columnAxis }),
});

const groupedPage = (grouping: TableGroupingState) =>
  selectOrdersPage({
    filters: [],
    grouping,
    includeTotal: true,
    limit: 20,
    offset: 0,
    sort: [],
  });

beforeEach(() => {
  vi.mocked(selectGroupedRows).mockReset();
  vi.mocked(selectGroupedRows).mockResolvedValue(groupedReadWithoutRows);
});

it('passes a column axis into the grouped read with the process ceiling', async () => {
  await groupedPage(axisGrouping('order_status'));

  expect(vi.mocked(selectGroupedRows).mock.calls[0]?.[0]?.columnAxis).toEqual({
    key: 'order_status',
    maxDistinct: expect.any(Number),
  });
});

it('does not pass a column axis when the grouping names none', async () => {
  await groupedPage(axisGrouping());

  expect(
    vi.mocked(selectGroupedRows).mock.calls[0]?.[0]?.columnAxis,
  ).toBeUndefined();
});
