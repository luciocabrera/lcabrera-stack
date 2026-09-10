import { vi } from 'vite-plus/test';

vi.mock(
  '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingAggregates.hook',
  () => ({ useGetTableGroupingAggregates: () => [] }),
);
vi.mock(
  '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingColumnAxis.hook',
  () => ({ useGetTableGroupingColumnAxis: () => undefined }),
);
vi.mock(
  '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingKeys.hook',
  () => ({ useGetTableGroupingKeys: () => [] }),
);
vi.mock(
  '#ui/components/Table/contexts/TableData/data/selectors/useGetTableData.hook',
  () => ({ useGetTableData: () => [] }),
);
