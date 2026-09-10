import { vi } from 'vite-plus/test';

vi.mock(
  '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: () => ({
      dataStore: { get: () => ({ data: [] }) },
    }),
  }),
);
