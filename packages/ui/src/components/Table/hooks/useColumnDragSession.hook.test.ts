// @vitest-environment jsdom

import type React from 'react';

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { setColumnSizingWithoutSyncMock, syncColumnsSizingMock } = vi.hoisted(
  () => ({
    setColumnSizingWithoutSyncMock: vi.fn(),
    syncColumnsSizingMock: vi.fn(),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnSizingWithoutSync: () => setColumnSizingWithoutSyncMock,
    useSyncColumnsSizing: () => syncColumnsSizingMock,
  }),
);

import { useColumnDragSession } from './useColumnDragSession.hook';

type CreateMouseDownEventArgs = {
  readonly clientX: number;
};

type Row = { readonly name: string };

const createMouseDownEvent = ({
  clientX,
}: CreateMouseDownEventArgs): React.MouseEvent<HTMLDivElement> =>
  ({
    clientX,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as React.MouseEvent<HTMLDivElement>;

describe('useColumnDragSession', () => {
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
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts resizing on mouse down and writes clamped widths on mouse move', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
        maxWidth: 260,
        minWidth: 120,
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

    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 260,
    });
    // Frames must not touch the cookie
    expect(syncColumnsSizingMock).not.toHaveBeenCalled();

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isResizing).toBe(false);
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  it('persists once per gesture, not once per frame', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
        minWidth: 100,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledTimes(3);
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('commits the final width when the release lands in the same frame as the last move', () => {
    // The suite's default stub runs frames synchronously; a real browser defers
    // them, so a quick drag delivers its last move and the release before the
    // queued frame ever runs. Queue frames here without running any.
    const pendingFrames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingFrames.push(callback);

      return pendingFrames.length;
    });

    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
        minWidth: 100,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 260 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    // The queued frame was cancelled on mouse up, so the gesture itself must
    // have committed where it was released: 200 + (260 - 100)
    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledTimes(1);
    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 360,
    });
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-write a width the last frame already applied', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
        minWidth: 100,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      // Runs synchronously via the default stub, so nothing stays pending
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledTimes(1);
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to default min width when current width is undefined', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: undefined,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
    });

    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 60,
    });
  });

  it('cleans up listeners and body styles on unmount while resizing', () => {
    const { result, unmount } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
    });

    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');

    unmount();

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));

    expect(setColumnSizingWithoutSyncMock).not.toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  it('stops listening to document mouse moves once the drag ends', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    });

    expect(setColumnSizingWithoutSyncMock).not.toHaveBeenCalled();
    expect(syncColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('supersedes an in-flight session when a new drag starts', () => {
    const { result } = renderHook(() =>
      useColumnDragSession<Row>({
        columnKey: 'name',
        currentWidth: 200,
        minWidth: 100,
      }),
    );

    act(() => {
      result.current.onMouseDown(createMouseDownEvent({ clientX: 100 }));
      result.current.onMouseDown(createMouseDownEvent({ clientX: 200 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));
    });

    // Only the second session's start position is live: 200 + (150 - 200)
    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledTimes(1);
    expect(setColumnSizingWithoutSyncMock).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 150,
    });
  });
});
