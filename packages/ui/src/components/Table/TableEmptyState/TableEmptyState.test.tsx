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
  revalidateMock,
  useElementSizeMock,
  useGetPinnedColumnPartitionMock,
  useGetTableTitleSingularMock,
  useResizeObserverMock,
  useTableContainerRefMock,
} = vi.hoisted(() => ({
  revalidateMock: vi.fn(),
  useElementSizeMock: vi.fn(),
  useGetPinnedColumnPartitionMock: vi.fn(),
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
  useGetPinnedColumnPartition: useGetPinnedColumnPartitionMock,
}));

vi.mock('#ui/components/Table/contexts/TableWrapper', () => ({
  useTableContainerRef: useTableContainerRefMock,
}));

vi.mock('#ui/hooks', () => ({
  useElementSize: useElementSizeMock,
  useResizeObserver: useResizeObserverMock,
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableTitleSingular: useGetTableTitleSingularMock,
}));

import { TableEmptyState } from './TableEmptyState.component';

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
  useGetTableTitleSingularMock.mockReturnValue('Order');
  useTableContainerRefMock.mockReturnValue(createRef<HTMLDivElement>());
});

afterEach(() => {
  cleanup();
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
});
