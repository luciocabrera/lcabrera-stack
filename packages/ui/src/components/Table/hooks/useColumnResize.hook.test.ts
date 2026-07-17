// @vitest-environment jsdom

import type React from 'react';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOnMouseDown, mockSetColumnSizing, mockUseColumnDragSession } =
  vi.hoisted(() => ({
    mockOnMouseDown: vi.fn(),
    mockSetColumnSizing: vi.fn(),
    mockUseColumnDragSession: vi.fn(),
  }));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnSizing: () => mockSetColumnSizing,
  }),
);

vi.mock('./useColumnDragSession.hook', () => ({
  useColumnDragSession: mockUseColumnDragSession,
}));

import { useColumnResize } from './useColumnResize.hook';

type CreateKeyEventArgs = {
  readonly key: string;
  readonly shiftKey?: boolean;
};

type Row = { readonly name: string };

const createKeyEvent = ({ key, shiftKey = false }: CreateKeyEventArgs) =>
  ({
    key,
    preventDefault: vi.fn(),
    shiftKey,
    stopPropagation: vi.fn(),
  }) as unknown as React.KeyboardEvent<HTMLElement>;

const createMouseEvent = () =>
  ({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as React.MouseEvent<HTMLElement>;

const renderResize = (args?: { readonly currentWidth?: number }) =>
  renderHook(() =>
    useColumnResize<Row>({
      columnKey: 'name',
      currentWidth: 120,
      maxWidth: 400,
      minWidth: 80,
      ...args,
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUseColumnDragSession.mockReturnValue({
    isResizing: false,
    onMouseDown: mockOnMouseDown,
  });
});

describe('useColumnResize', () => {
  it('exposes the width and resolved bounds a splitter has to announce', () => {
    const { result } = renderResize();

    expect(result.current.width).toBe(120);
    expect(result.current.bounds).toEqual({ maxWidth: 400, minWidth: 80 });
  });

  it('falls back to the min bound when the column has no width yet', () => {
    const { result } = renderResize({ currentWidth: undefined });

    expect(result.current.width).toBe(80);
  });

  it('hands the pointer gesture to the drag session untouched', () => {
    const { result } = renderResize();

    expect(mockUseColumnDragSession).toHaveBeenCalledWith({
      columnKey: 'name',
      currentWidth: 120,
      maxWidth: 400,
      minWidth: 80,
    });
    expect(result.current.onMouseDown).toBe(mockOnMouseDown);
  });

  it('reports the drag session isResizing flag', () => {
    mockUseColumnDragSession.mockReturnValue({
      isResizing: true,
      onMouseDown: mockOnMouseDown,
    });

    expect(renderResize().result.current.isResizing).toBe(true);
  });

  it('resets the width on double-click', () => {
    const { result } = renderResize();

    act(() => {
      result.current.onDoubleClick(createMouseEvent());
    });

    expect(mockSetColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      width: undefined,
    });
  });

  it('steps the width with the arrow keys, coarser while shift is held', () => {
    const { result } = renderResize();

    act(() => {
      result.current.onKeyDown(createKeyEvent({ key: 'ArrowRight' }));
    });

    expect(mockSetColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 128,
    });

    act(() => {
      result.current.onKeyDown(
        createKeyEvent({ key: 'ArrowRight', shiftKey: true }),
      );
    });

    expect(mockSetColumnSizing).toHaveBeenLastCalledWith({
      columnKey: 'name',
      width: 160,
    });
  });

  it('jumps to the bounds on Home and End', () => {
    const { result } = renderResize();

    act(() => {
      result.current.onKeyDown(createKeyEvent({ key: 'End' }));
    });

    expect(mockSetColumnSizing).toHaveBeenLastCalledWith({
      columnKey: 'name',
      width: 400,
    });

    act(() => {
      result.current.onKeyDown(createKeyEvent({ key: 'Home' }));
    });

    expect(mockSetColumnSizing).toHaveBeenLastCalledWith({
      columnKey: 'name',
      width: 80,
    });
  });

  it('resets the width on Enter', () => {
    const { result } = renderResize();

    act(() => {
      result.current.onKeyDown(createKeyEvent({ key: 'Enter' }));
    });

    expect(mockSetColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      width: undefined,
    });
  });

  it('leaves a key it does not own alone, without swallowing the event', () => {
    const { result } = renderResize();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    act(() => {
      result.current.onKeyDown({
        key: 'ArrowDown',
        preventDefault,
        shiftKey: false,
        stopPropagation,
      } as unknown as React.KeyboardEvent<HTMLElement>);
    });

    expect(mockSetColumnSizing).not.toHaveBeenCalled();
    // An unowned key must keep bubbling — the table still handles it
    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});
