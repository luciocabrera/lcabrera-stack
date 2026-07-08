// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  revalidateMock,
  useElementSizeMock,
  useGetColumnGroupsMock,
  useTableContainerRefMock,
} = vi.hoisted(() => ({
  revalidateMock: vi.fn(),
  useElementSizeMock: vi.fn(),
  useGetColumnGroupsMock: vi.fn(),
  useTableContainerRefMock: vi.fn(),
}));

vi.mock('react-router', () => ({
  useRevalidator: () => ({ revalidate: revalidateMock }),
}));

vi.mock('@repo/ui/components/Button', () => ({
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

vi.mock('@repo/ui/components/Icons', () => ({
  NoDataDescriptive: () => <svg data-testid='no-data-icon' />,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumnGroups: useGetColumnGroupsMock,
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableWrapper', () => ({
  useTableContainerRef: useTableContainerRefMock,
}));

vi.mock('@repo/ui/hooks', () => ({
  useElementSize: useElementSizeMock,
}));

import { TableEmptyState } from './TableEmptyState.component';

const renderInTable = (ui: ReactNode) =>
  render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  );

beforeEach(() => {
  useGetColumnGroupsMock.mockReturnValue({
    centerCols: [{ key: 'name' }, { key: 'amount' }],
    leftPinnedCols: [{ key: 'id' }],
    rightPinnedCols: [],
  });
  useElementSizeMock.mockReturnValue({ height: 0, width: 0 });
  useTableContainerRefMock.mockReturnValue(createRef<HTMLDivElement>());
});

afterEach(() => {
  cleanup();
  revalidateMock.mockReset();
});

describe('TableEmptyState', () => {
  it('renders the default title, message and illustration', () => {
    renderInTable(<TableEmptyState />);

    expect(screen.getByRole('heading').textContent).toBe('No data found');
    expect(screen.getByTestId('no-data-icon')).not.toBeNull();
    expect(
      screen.getByText(/No records match the current view/),
    ).not.toBeNull();
  });

  it('renders custom title and message overrides', () => {
    renderInTable(<TableEmptyState />);

    expect(screen.getByRole('heading').textContent).toBe('All caught up');
    expect(screen.getByText('Nothing to show')).not.toBeNull();
  });

  it('spans every visible column via colSpan', () => {
    const { container } = renderInTable(<TableEmptyState />);

    expect(container.querySelector('td')?.getAttribute('colspan')).toBe('3');
  });

  it('revalidates the route when Retry is clicked', () => {
    renderInTable(<TableEmptyState />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });
});
