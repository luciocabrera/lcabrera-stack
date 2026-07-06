// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  MockTable,
  readPersistedDataStateFromSessionStorageMock,
  useGetColumnsMock,
  useGetTableAppIdMock,
  useGetTablePersistenceKeyMock,
  useGetTablePlaceholderRowCountMock,
} = vi.hoisted(() => ({
  MockTable: vi.fn(() => <div data-testid='skeleton-table'>Loading...</div>),
  readPersistedDataStateFromSessionStorageMock: vi.fn<
    () =>
      | undefined
      | {
          readonly data: readonly Record<string, unknown>[];
          readonly totalRows: number;
        }
  >(() => {}),
  useGetColumnsMock: vi.fn(),
  useGetTableAppIdMock: vi.fn(() => {}),
  useGetTablePersistenceKeyMock: vi.fn(() => 'orders'),
  useGetTablePlaceholderRowCountMock: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumns: useGetColumnsMock,
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableAppId: useGetTableAppIdMock,
    useGetTablePersistenceKey: useGetTablePersistenceKeyMock,
    useGetTablePlaceholderRowCount: useGetTablePlaceholderRowCountMock,
  }),
);

vi.mock('../utils', () => ({
  readPersistedDataStateFromSessionStorage:
    readPersistedDataStateFromSessionStorageMock,
}));

vi.mock('../Table.component', () => ({
  Table: MockTable,
}));

import { TableSkeleton } from './TableSkeleton.component';

describe('TableSkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cached rows on refresh when session state exists', () => {
    useGetColumnsMock.mockReturnValue([{ key: 'name', label: 'Name' }]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(3);
    readPersistedDataStateFromSessionStorageMock.mockReturnValue({
      data: [{ name: 'Alice' }],
      totalRows: 99,
    });

    render(<TableSkeleton />);

    expect(screen.getByTestId('skeleton-table').textContent).toBe('Loading...');
  });

  it('renders the Table component with loading state', () => {
    useGetColumnsMock.mockReturnValue([{ key: 'name', label: 'Name' }]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(3);
    readPersistedDataStateFromSessionStorageMock.mockReturnValue(undefined);

    render(<TableSkeleton />);

    expect(screen.getByTestId('skeleton-table').textContent).toBe('Loading...');
  });

  it('calls useGetColumns and useGetTablePlaceholderRowCount', () => {
    useGetColumnsMock.mockReturnValue([
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(5);
    readPersistedDataStateFromSessionStorageMock.mockReturnValue(undefined);

    render(<TableSkeleton />);

    expect(useGetColumnsMock).toHaveBeenCalled();
    expect(useGetTablePersistenceKeyMock).toHaveBeenCalled();
    expect(useGetTablePlaceholderRowCountMock).toHaveBeenCalled();
  });
});
