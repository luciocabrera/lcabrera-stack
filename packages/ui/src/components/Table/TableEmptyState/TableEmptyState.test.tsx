// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const {
  clearGroupingMock,
  revalidateMock,
  useClearTableGroupingMock,
  useElementSizeMock,
  useGetNormalizedColumnMock,
  useGetPinnedColumnPartitionMock,
  useGetTableDataErrorMock,
  useGetTableGroupingKeysMock,
  useGetTableTitleSingularMock,
  useResizeObserverMock,
  useTableContainerRefMock,
} = vi.hoisted(() => ({
  clearGroupingMock: vi.fn(),
  revalidateMock: vi.fn(),
  useClearTableGroupingMock: vi.fn(),
  useElementSizeMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
  useGetPinnedColumnPartitionMock: vi.fn(),
  useGetTableDataErrorMock: vi.fn(),
  useGetTableGroupingKeysMock: vi.fn(),
  useGetTableTitleSingularMock: vi.fn(),
  useResizeObserverMock: vi.fn(),
  useTableContainerRefMock: vi.fn(),
}));

vi.mock('react-router', () => ({
  useRevalidator: () => ({ revalidate: revalidateMock }),
}));

vi.mock('#ui/components/Button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    readonly children: ReactNode;
    readonly onClick?: () => void;
  }) => (
    <button onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('#ui/components/Icons', () => ({
  NoDataDescriptive: () => <svg data-testid='no-data-icon' />,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: useGetNormalizedColumnMock,
  useGetPinnedColumnPartition: useGetPinnedColumnPartitionMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useClearTableGrouping: useClearTableGroupingMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingKeys: useGetTableGroupingKeysMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableTitleSingular: useGetTableTitleSingularMock,
}));

vi.mock('#ui/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableDataError: useGetTableDataErrorMock,
}));

vi.mock('#ui/components/Table/contexts/TableWrapper', () => ({
  useTableContainerRef: useTableContainerRefMock,
}));

vi.mock('#ui/hooks', () => ({
  useElementSize: useElementSizeMock,
  useResizeObserver: useResizeObserverMock,
}));

import { TableEmptyState } from './TableEmptyState.component';

const REFUSAL_MESSAGE =
  'Column "total_amount" is not a legal group key: too-many-distinct.';

const renderInTable = (ui: ReactNode) =>
  render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  );

beforeEach(() => {
  useGetPinnedColumnPartitionMock.mockReturnValue({
    centerCols: [{ key: 'name' }, { key: 'amount' }],
    leftPinnedCols: [{ key: 'id' }],
    rightPinnedCols: [],
  });
  useElementSizeMock.mockReturnValue({ height: 0, width: 0 });
  useGetNormalizedColumnMock.mockReturnValue(undefined);
  useGetTableDataErrorMock.mockReturnValue(undefined);
  useGetTableGroupingKeysMock.mockReturnValue([]);
  useGetTableTitleSingularMock.mockReturnValue('Order');
  useClearTableGroupingMock.mockReturnValue(clearGroupingMock);
  useTableContainerRefMock.mockReturnValue(createRef<HTMLDivElement>());
});

afterEach(() => {
  cleanup();
  clearGroupingMock.mockReset();
  revalidateMock.mockReset();
});

describe('TableEmptyState', () => {
  it('renders the table-config singular title, default message and illustration', () => {
    renderInTable(<TableEmptyState />);

    expect(screen.getByRole('heading').textContent).toBe('Order');
    expect(screen.getByTestId('no-data-icon')).not.toBeNull();
    expect(
      screen.getByText(/No records match the current view/),
    ).not.toBeNull();
  });

  it('reflects the meta store title in the heading', () => {
    useGetTableTitleSingularMock.mockReturnValue('Enterprise Order');

    renderInTable(<TableEmptyState />);

    expect(screen.getByRole('heading').textContent).toBe('Enterprise Order');
  });

  it('spans every visible column via colSpan', () => {
    const { container } = renderInTable(<TableEmptyState />);

    expect(container.querySelector('td')?.getAttribute('colspan')).toBe('3');
  });

  it('observes the sticky header height via useResizeObserver', () => {
    renderInTable(<TableEmptyState />);

    expect(useResizeObserverMock).toHaveBeenCalledWith(
      expect.objectContaining({
        getTarget: expect.any(Function),
        onMeasure: expect.any(Function),
      }),
    );
  });

  it('revalidates the route when Retry is clicked', () => {
    renderInTable(<TableEmptyState />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });

  describe('when the read was refused rather than empty', () => {
    beforeEach(() => {
      useGetTableDataErrorMock.mockReturnValue({
        column: 'total_amount',
        kind: 'grouping-refused',
        message: REFUSAL_MESSAGE,
        reason: 'column-not-groupable',
      });
      useGetTableGroupingKeysMock.mockReturnValue(['total_amount']);
      useGetNormalizedColumnMock.mockReturnValue({
        key: 'total_amount',
        label: 'Total Amount',
      });
    });

    it('says the grouping was refused, naming the column as the header labels it', () => {
      renderInTable(<TableEmptyState />);

      expect(screen.getByRole('heading').textContent).toBe(
        'Grouping by Total Amount was refused',
      );
      expect(screen.getByText(REFUSAL_MESSAGE)).not.toBeNull();
    });

    it('drops the no-data message, which would explain the wrong thing', () => {
      renderInTable(<TableEmptyState />);

      expect(
        screen.queryByText(/No records match the current view/),
      ).toBeNull();
    });

    it('offers clearing the grouping instead of a retry that would be refused again', () => {
      renderInTable(<TableEmptyState />);

      expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Clear grouping' }));

      expect(clearGroupingMock).toHaveBeenCalledTimes(1);
      expect(revalidateMock).not.toHaveBeenCalled();
    });

    it('falls back to the raw column key when no column carries that label', () => {
      useGetNormalizedColumnMock.mockReturnValue(undefined);

      renderInTable(<TableEmptyState />);

      expect(screen.getByRole('heading').textContent).toBe(
        'Grouping by total_amount was refused',
      );
    });

    it('keeps the retry offer for a refusal with nothing grouped to clear', () => {
      useGetTableGroupingKeysMock.mockReturnValue([]);

      renderInTable(<TableEmptyState />);

      expect(screen.getByRole('button', { name: 'Retry' })).not.toBeNull();
    });
  });

  it('surfaces a cancelled read without offering to clear a grouping', () => {
    useGetTableDataErrorMock.mockReturnValue({
      kind: 'db-canceled',
      message: 'The query was cancelled.',
    });

    renderInTable(<TableEmptyState />);

    expect(screen.getByRole('heading').textContent).toBe(
      'This query took too long',
    );
    expect(screen.getByText('The query was cancelled.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).not.toBeNull();
  });
});
