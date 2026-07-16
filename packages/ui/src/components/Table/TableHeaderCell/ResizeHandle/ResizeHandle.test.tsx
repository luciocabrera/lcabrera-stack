// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetColumnSizing, mockUseColumnResize } = vi.hoisted(() => ({
  mockSetColumnSizing: vi.fn(),
  mockUseColumnResize: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnSizing: () => mockSetColumnSizing,
  }),
);

vi.mock('@repo/ui/components/Table/hooks', () => ({
  useColumnResize: mockUseColumnResize,
}));

import { ResizeHandle } from './ResizeHandle.component';

afterEach(cleanup);

describe('ResizeHandle', () => {
  it('renders a button with the column-labeled aria-label', () => {
    mockUseColumnResize.mockReturnValue({
      isResizing: false,
      onMouseDown: vi.fn(),
    });

    render(
      <ResizeHandle
        columnKey='name'
        columnLabel='Name'
        currentWidth={120}
        minWidth={80}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Resize Name column' }),
    ).not.toBeNull();
  });

  it('passes the expected args to useColumnResize and forwards resize events to setColumnSizing', () => {
    mockUseColumnResize.mockReturnValue({
      isResizing: false,
      onMouseDown: vi.fn(),
    });

    render(
      <ResizeHandle
        columnKey='name'
        columnLabel='Name'
        currentWidth={120}
        maxWidth={400}
        minWidth={80}
      />,
    );

    expect(mockUseColumnResize).toHaveBeenCalledWith({
      columnKey: 'name',
      currentWidth: 120,
      maxWidth: 400,
      minWidth: 80,
      onResize: expect.any(Function),
    });

    const resizeCall = mockUseColumnResize.mock.calls.at(0);
    const firstArg = resizeCall ? resizeCall[0] : undefined;
    const { onResize } = firstArg as {
      onResize: (params: { columnKey: string; width: number }) => void;
    };
    onResize({ columnKey: 'name', width: 200 });

    expect(mockSetColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 200,
    });
  });

  it('delegates mousedown to the hook onMouseDown', () => {
    const onMouseDown = vi.fn();
    mockUseColumnResize.mockReturnValue({ isResizing: false, onMouseDown });

    render(
      <ResizeHandle
        columnKey='name'
        columnLabel='Name'
        currentWidth={120}
        minWidth={80}
      />,
    );

    fireEvent.mouseDown(
      screen.getByRole('button', { name: 'Resize Name column' }),
    );
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('resets the column width on double-click', () => {
    mockUseColumnResize.mockReturnValue({
      isResizing: false,
      onMouseDown: vi.fn(),
    });

    render(
      <ResizeHandle
        columnKey='name'
        columnLabel='Name'
        currentWidth={120}
        minWidth={80}
      />,
    );

    fireEvent.doubleClick(
      screen.getByRole('button', { name: 'Resize Name column' }),
    );

    expect(mockSetColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      width: undefined,
    });
  });
});
