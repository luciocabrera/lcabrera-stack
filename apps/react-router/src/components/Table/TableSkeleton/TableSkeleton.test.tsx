// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { MockTable, useGetColumnsMock, useGetTablePlaceholderRowCountMock } =
  vi.hoisted(() => ({
    MockTable: vi.fn(() => <div data-testid='skeleton-table'>Loading...</div>),
    useGetColumnsMock: vi.fn(),
    useGetTablePlaceholderRowCountMock: vi.fn(),
  }));

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumns: useGetColumnsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTablePlaceholderRowCount: useGetTablePlaceholderRowCountMock,
}));

vi.mock('../Table.component', () => ({
  Table: MockTable,
}));

import { TableSkeleton } from './TableSkeleton.component.tsx';

describe('TableSkeleton', () => {
  it('renders the Table component with loading state', () => {
    useGetColumnsMock.mockReturnValue([{ key: 'name', label: 'Name' }]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(3);

    render(<TableSkeleton />);

    expect(screen.getByTestId('skeleton-table').textContent).toBe('Loading...');
  });

  it('calls useGetColumns and useGetTablePlaceholderRowCount', () => {
    useGetColumnsMock.mockReturnValue([
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(5);

    render(<TableSkeleton />);

    expect(useGetColumnsMock).toHaveBeenCalled();
    expect(useGetTablePlaceholderRowCountMock).toHaveBeenCalled();
  });
});
