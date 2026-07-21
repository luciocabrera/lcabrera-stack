// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockTableProps = {
  readonly dataSelector?: (response: unknown) => readonly unknown[];
  readonly dataTotalSelector?: (response: unknown) => number;
  readonly isLoading?: boolean;
  readonly response?: unknown;
};

const { MockTable, useGetColumnsMock, useGetTablePlaceholderRowCountMock } =
  vi.hoisted(() => ({
    MockTable: vi.fn((props: MockTableProps) => (
      <div data-testid='skeleton-table'>
        {props.isLoading ? 'Loading...' : 'Loaded'}
      </div>
    )),
    useGetColumnsMock: vi.fn(),
    useGetTablePlaceholderRowCountMock: vi.fn(),
  }));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumns: useGetColumnsMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTablePlaceholderRowCount: useGetTablePlaceholderRowCountMock,
  }),
);

vi.mock('../Table.component', () => ({
  Table: MockTable,
}));

import { TableSkeleton } from './TableSkeleton.component';

const getTableProps = (): MockTableProps =>
  MockTable.mock.calls.at(-1)?.[0] ?? {};

describe('TableSkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useGetColumnsMock.mockReturnValue([{ key: 'name', label: 'Name' }]);
    useGetTablePlaceholderRowCountMock.mockReturnValue(3);
  });

  it('renders the Table component in its loading state', () => {
    render(<TableSkeleton />);

    expect(screen.getByTestId('skeleton-table').textContent).toBe('Loading...');
    expect(getTableProps().isLoading).toBe(true);
  });

  it('reserves exactly placeholderRowCount rows', () => {
    // TableBody sizes <tbody> as these rows × rowHeight, so the count the
    // skeleton reserves is the height the real response has to match. Any
    // other source of rows here reserves a height the loader cannot honour.
    useGetTablePlaceholderRowCountMock.mockReturnValue(7);

    render(<TableSkeleton />);

    const { dataSelector, dataTotalSelector, response } = getTableProps();

    expect(dataSelector?.(response)).toHaveLength(7);
    expect(dataTotalSelector?.(response)).toBe(7);
  });

  it('reads its columns and placeholder row count from the config store', () => {
    render(<TableSkeleton />);

    expect(useGetColumnsMock).toHaveBeenCalled();
    expect(useGetTablePlaceholderRowCountMock).toHaveBeenCalled();
  });
});
