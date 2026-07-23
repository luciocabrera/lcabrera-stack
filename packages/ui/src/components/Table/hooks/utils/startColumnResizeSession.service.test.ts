// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { startColumnResizeSession } from './startColumnResizeSession.service';

type Row = { readonly name: string };

const startSession = (overrides?: {
  readonly currentWidth?: number | undefined;
}) => {
  const callbacks = {
    onGestureEnd: vi.fn(),
    onSessionEnd: vi.fn(),
    setColumnWidth: vi.fn(),
    syncColumnWidth: vi.fn(),
  };

  const endDragSession = startColumnResizeSession<Row>({
    clientX: 100,
    columnKey: 'name',
    currentWidth: 200,
    ...overrides,
    ...callbacks,
  });

  return { ...callbacks, endDragSession };
};

const moveTo = (clientX: number) => {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX }));
};

describe('startColumnResizeSession', () => {
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
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('suppresses text selection while the gesture is in flight', () => {
    const { endDragSession } = startSession();

    expect(document.body.style.userSelect).toBe('none');
    expect(document.body.style.cursor).toBe('col-resize');

    endDragSession();

    expect(document.body.style.userSelect).toBe('');
    expect(document.body.style.cursor).toBe('');
  });

  it('writes the width the pointer moved to', () => {
    const { setColumnWidth } = startSession();

    moveTo(150);

    expect(setColumnWidth).toHaveBeenCalledWith({
      columnKey: 'name',
      width: 250,
    });
  });

  it('persists once on release, after the final width is written', () => {
    const { setColumnWidth, syncColumnWidth } = startSession();

    moveTo(150);
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(syncColumnWidth).toHaveBeenCalledTimes(1);
    expect(setColumnWidth.mock.invocationCallOrder.at(-1)).toBeLessThan(
      syncColumnWidth.mock.invocationCallOrder[0] as number,
    );
  });

  it('reports the gesture and the teardown when the pointer is released', () => {
    const { onGestureEnd, onSessionEnd } = startSession();

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(onGestureEnd).toHaveBeenCalledTimes(1);
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('reports the teardown but not the gesture when ended externally', () => {
    const { endDragSession, onGestureEnd, onSessionEnd } = startSession();

    endDragSession();

    expect(onSessionEnd).toHaveBeenCalledTimes(1);
    expect(onGestureEnd).not.toHaveBeenCalled();
  });

  it('stops writing widths once the session has ended', () => {
    const { endDragSession, setColumnWidth } = startSession();

    endDragSession();
    moveTo(150);

    expect(setColumnWidth).not.toHaveBeenCalled();
  });
});
