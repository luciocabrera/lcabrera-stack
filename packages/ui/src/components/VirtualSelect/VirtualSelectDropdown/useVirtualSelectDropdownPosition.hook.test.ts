// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { useVirtualSelectDropdownPosition } from './useVirtualSelectDropdownPosition.hook';

const observerCallbackRef: {
  current: ResizeObserverCallback | undefined;
} = { current: undefined };

const disconnectMock = vi.fn();

type StubRectArgs = {
  readonly bottom?: number;
  readonly element: HTMLElement;
  readonly height?: number;
  readonly left?: number;
  readonly top?: number;
  readonly width?: number;
};

/**
 * jsdom lays nothing out, so every rect the hook reads has to be stubbed. Only
 * the four values `resolveDropdownPlacement` consumes matter.
 */
const stubRect = ({
  bottom = 0,
  element,
  height = 0,
  left = 0,
  top = 0,
  width = 0,
}: StubRectArgs) => {
  element.getBoundingClientRect = () =>
    ({ bottom, height, left, top, width }) as DOMRect;
};

const setup = () => {
  const anchor = document.createElement('div');
  const dropdown = document.createElement('div');

  stubRect({ bottom: 100, element: anchor, left: 20, top: 80, width: 200 });
  stubRect({ element: dropdown, height: 150 });

  const onScrollAway = vi.fn();
  const view = renderHook(() =>
    useVirtualSelectDropdownPosition({
      anchorRef: { current: anchor },
      dropdownRef: { current: dropdown },
      isEnabled: true,
      onScrollAway,
    }),
  );

  return { anchor, dropdown, onScrollAway, view };
};

/**
 * The ResizeObserver drives every measurement, including the first. `act` is
 * required, not decorative: the callback sets state from outside React's event
 * system, so without it `result.current` never advances past `undefined`.
 */
const observe = () => {
  act(() => {
    observerCallbackRef.current?.([], {} as ResizeObserver);
  });
};

beforeEach(() => {
  observerCallbackRef.current = undefined;
  disconnectMock.mockClear();

  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = disconnectMock;
      observe = vi.fn();
      unobserve = vi.fn();

      constructor(callback: ResizeObserverCallback) {
        observerCallbackRef.current = callback;
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('useVirtualSelectDropdownPosition', () => {
  it('measures nothing until the observer fires', () => {
    const { view } = setup();

    expect(view.result.current).toBeUndefined();
  });

  it('anchors below the trigger once observed', () => {
    const { view } = setup();

    observe();

    // bottom 100 + DROPDOWN_GAP_PX 12
    expect(view.result.current).toEqual({ left: 20, top: 112, width: 200 });
  });

  it('keeps the same placement object when the geometry has not moved', () => {
    const { view } = setup();

    observe();
    const first = view.result.current;
    observe();

    // Identity, not equality: a fresh object re-renders the virtualized list
    // and re-triggers the ResizeObserver that produced it, which is the
    // feedback loop this guard exists to break.
    expect(view.result.current).toBe(first);
  });

  it('replaces the placement when the trigger moves', () => {
    const { anchor, view } = setup();

    observe();
    const first = view.result.current;

    stubRect({ bottom: 300, element: anchor, left: 20, top: 280, width: 200 });
    observe();

    expect(view.result.current).not.toBe(first);
    expect(view.result.current).toEqual({ left: 20, top: 312, width: 200 });
  });

  it('replaces the placement when only the width changes', () => {
    const { anchor, view } = setup();

    observe();
    const first = view.result.current;

    stubRect({ bottom: 100, element: anchor, left: 20, top: 80, width: 240 });
    observe();

    expect(view.result.current).not.toBe(first);
    expect(view.result.current?.width).toBe(240);
  });

  it('dismisses rather than chasing when an ancestor scrolls', () => {
    const { onScrollAway } = setup();

    globalThis.dispatchEvent(new Event('scroll'));

    expect(onScrollAway).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer on unmount', () => {
    const { view } = setup();

    view.unmount();

    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it('does not observe while disabled', () => {
    const anchor = document.createElement('div');
    const dropdown = document.createElement('div');

    renderHook(() =>
      useVirtualSelectDropdownPosition({
        anchorRef: { current: anchor },
        dropdownRef: { current: dropdown },
        isEnabled: false,
        onScrollAway: vi.fn(),
      }),
    );

    expect(observerCallbackRef.current).toBeUndefined();
  });
});
