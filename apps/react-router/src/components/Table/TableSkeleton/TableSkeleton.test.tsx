// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  MockTable,
  readPersistedDataStateFromSessionStorageMock,
  useGetColumnsMock,
  useGetTablePersistenceKeyMock,
  useGetTablePlaceholderRowCountMock,
} = vi.hoisted(() => ({
  MockTable: vi.fn((_props: unknown) => (
    <div data-testid='skeleton-table'>Loading...</div>
  )),
  readPersistedDataStateFromSessionStorageMock: vi.fn<
    () =>
      | {
          readonly data: readonly Record<string, unknown>[];
          readonly totalRows: number;
        }
      | undefined
  >(() => undefined),
  useGetColumnsMock: vi.fn(),
  useGetTablePersistenceKeyMock: vi.fn(() => 'orders'),
  useGetTablePlaceholderRowCountMock: vi.fn(),
}));

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumns: useGetColumnsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTablePersistenceKey: useGetTablePersistenceKeyMock,
  useGetTablePlaceholderRowCount: useGetTablePlaceholderRowCountMock,
}));

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

    expect(MockTable.mock.calls[0]?.[0]).toMatchObject({
      response: {
        data: [{ name: '' }, { name: '' }, { name: '' }],
        totalRows: 3,
      },
    });

    return waitFor(() => {
      const tableProps = MockTable.mock.calls.at(-1)?.[0] as
        | {
            dataTotalSelector?: (response: {
              readonly data: readonly Record<string, unknown>[];
              readonly totalRows: number;
            }) => number;
            response: {
              readonly data: readonly Record<string, unknown>[];
              readonly totalRows: number;
            };
          }
        | undefined;

      expect(tableProps?.response.data).toEqual([{ name: 'Alice' }]);
      expect(tableProps?.response.totalRows).toBe(99);
      expect(tableProps?.dataTotalSelector?.(tableProps.response)).toBe(99);
    });
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
