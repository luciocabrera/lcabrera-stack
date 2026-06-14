// @vitest-environment jsdom

import type { MutableRefObject } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { trackRenderMock } = vi.hoisted(() => ({
  trackRenderMock: vi.fn(),
}));

vi.mock('../renderTracker.util', () => ({
  trackRender: trackRenderMock,
}));

import { trackCurrentRender } from './trackCurrentRender.util';

describe('trackCurrentRender', () => {
  afterEach(() => {
    trackRenderMock.mockReset();
    vi.restoreAllMocks();
  });

  it('tracks the render, updates refs, and logs changed props', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockReturnValue(250);

    const prevProps = {
      current: { density: 'compact', striped: false },
    } as MutableRefObject<Record<string, unknown> | undefined>;
    const renderStartTime = {
      current: 100,
    } as MutableRefObject<number>;
    const nextProps = { density: 'comfortable', striped: false };

    trackCurrentRender({
      componentName: 'OrdersTable',
      logProps: nextProps,
      prevProps,
      renderStartTime,
    });

    expect(trackRenderMock).toHaveBeenCalledWith('OrdersTable');
    expect(logSpy).toHaveBeenCalledWith(
      '[OrdersTable] Props changed:',
      'density',
    );
    expect(prevProps.current).toEqual(nextProps);
    expect(renderStartTime.current).toBe(250);
  });

  it('skips prop logging when no previous props exist', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    trackCurrentRender({
      componentName: 'OrdersTable',
      logProps: { density: 'compact' },
      prevProps: { current: undefined },
      renderStartTime: { current: 0 },
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
