// @vitest-environment jsdom

import type React from 'react';

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useColumnResize } from './useColumnResize.hook';

const { mockUseSyncColumnsSizing, syncColumnsSizingMock } = vi.hoisted(() => {
  const syncColumnsSizingMock = vi.fn();
  const mockUseSyncColumnsSizing = () => syncColumnsSizingMock;

  return { mockUseSyncColumnsSizing, syncColumnsSizingMock };
});

vi.mock(
  '../contexts/TableConfig/columns/actions/useSyncColumnsSizing.hook',
  () => ({
    useSyncColumnsSizing: mockUseSyncColumnsSizing,
  }),
);

type CreateMouseDownEventArgs = {
  readonly clientX: number;
};

const createMouseDownEvent = ({
  clientX,
}: CreateMouseDownEventArgs): React.MouseEvent<HTMLDivElement> =>
  ({
    clientX,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as React.MouseEvent<HTMLDivElement>;

describe('useColumnResize', () => {
  beforeEach(() => {
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    // Unmount hooks so in-flight drag sessions release their document listeners
    cleanup();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    syncColumnsSizingMock.mockReset();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts resizing on mouse down and emits clamped widths on mouse move', () => {
    const onResize = vi.fn();
    const { result } = renderHook(() =>
      useColumnResize({
        columnKey: 'name',
        currentWidth: 200,
        maxWidth: 260,
        minWidth: 120,
        onResize,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
    });

    expect(result.current.isResizing).toBe(true);
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    });

    expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', width: 260 });

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isResizing).toBe(false);
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  it('falls back to default min width when current width is undefined', () => {
    const onResize = vi.fn();
    const { result } = renderHook(() =>
      useColumnResize({
        columnKey: 'name',
        currentWidth: undefined,
        onResize,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
    });

    expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', width: 60 });
  });

  it('cleans up listeners and body styles on unmount while resizing', () => {
    const onResize = vi.fn();
    const { result, unmount } = renderHook(() =>
      useColumnResize({
        columnKey: 'name',
        currentWidth: 200,
        onResize,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
    });

    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');

    unmount();

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));

    expect(onResize).not.toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  it('stops listening to document mouse moves once the drag ends', () => {
    const onResize = vi.fn();
    const { result } = renderHook(() =>
      useColumnResize({
        columnKey: 'name',
        currentWidth: 200,
        onResize,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    });

    expect(onResize).not.toHaveBeenCalled();
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('supersedes an in-flight session when a new drag starts', () => {
    const onResize = vi.fn();
    const { result } = renderHook(() =>
      useColumnResize({
        columnKey: 'name',
        currentWidth: 200,
        minWidth: 100,
        onResize,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      result.current.onMouseDown(createMouseDownEvent({ clientX: 200 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));
    });

    // Only the second session's start position is live: 200 + (150 - 200)
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', width: 150 });
  });
});
