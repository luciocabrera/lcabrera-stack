// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { setupObservedContainer } from './setupObservedContainer.util';

const frameCallbacks: FrameRequestCallback[] = [];

const flushFrame = () => {
  const callback = frameCallbacks.shift();
  callback?.(performance.now());
};

beforeEach(() => {
  frameCallbacks.length = 0;

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setupObservedContainer', () => {
  it('measures once and syncs the initial scroll position immediately', () => {
    const container = document.createElement('div');
    const onMeasure = vi.fn();
    const setScroll = vi.fn();
    const readScroll = vi.fn(() => 12);

    const cleanup = setupObservedContainer({
      container,
      onMeasure,
      readScroll,
      setScroll,
    });

    expect(onMeasure).toHaveBeenCalledTimes(1);
    // syncScrollPosition() runs synchronously at setup.
    expect(setScroll).toHaveBeenCalledExactlyOnceWith(12);

    cleanup();
  });

  it('coalesces scroll events into a single animation frame before reading scroll', () => {
    const container = document.createElement('div');
    const setScroll = vi.fn();
    let scrollValue = 0;
    const readScroll = vi.fn(() => scrollValue);

    const cleanup = setupObservedContainer({
      container,
      onMeasure: vi.fn(),
      readScroll,
      setScroll,
    });

    setScroll.mockClear();
    scrollValue = 40;

    // Two scrolls in the same frame → only one requestAnimationFrame scheduled.
    container.dispatchEvent(new Event('scroll'));
    container.dispatchEvent(new Event('scroll'));
    expect(frameCallbacks).toHaveLength(1);
    expect(setScroll).not.toHaveBeenCalled();

    flushFrame();
    expect(setScroll).toHaveBeenCalledExactlyOnceWith(40);

    // A subsequent scroll schedules a fresh frame now the flag is cleared.
    container.dispatchEvent(new Event('scroll'));
    expect(frameCallbacks).toHaveLength(1);

    cleanup();
  });

  it('cancels a pending animation frame and detaches listeners on cleanup', () => {
    const container = document.createElement('div');
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    const disconnect = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        public disconnect = disconnect;
        public observe = vi.fn();
        public unobserve = vi.fn();
      },
    );

    const cleanup = setupObservedContainer({
      container,
      onMeasure: vi.fn(),
      readScroll: () => 0,
      setScroll: vi.fn(),
    });

    // Schedule a frame, then tear down before it flushes.
    container.dispatchEvent(new Event('scroll'));
    expect(frameCallbacks).toHaveLength(1);

    cleanup();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('skips the ResizeObserver wiring when the API is unavailable', () => {
    const container = document.createElement('div');
    vi.stubGlobal('ResizeObserver', undefined);

    const cleanup = setupObservedContainer({
      container,
      onMeasure: vi.fn(),
      readScroll: () => 0,
      setScroll: vi.fn(),
    });

    // No throw, and cleanup is still safe to call without a resize observer.
    expect(() => cleanup()).not.toThrow();
  });

  it('tolerates an absent container without attaching a scroll listener', () => {
    const onMeasure = vi.fn();
    const setScroll = vi.fn();

    const cleanup = setupObservedContainer({
      container: undefined,
      onMeasure,
      readScroll: () => 5,
      setScroll,
    });

    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(setScroll).toHaveBeenCalledExactlyOnceWith(5);
    expect(() => cleanup()).not.toThrow();
  });
});
