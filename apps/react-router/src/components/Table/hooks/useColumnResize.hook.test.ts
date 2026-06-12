// @vitest-environment jsdom

import type React from 'react';

import { act, renderHook } from '@testing-library/react';
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
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
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

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function),
    );
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });
});
