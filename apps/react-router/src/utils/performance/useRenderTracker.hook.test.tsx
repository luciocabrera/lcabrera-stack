// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { trackRenderCompleteMock, trackRenderMock } = vi.hoisted(() => ({
  trackRenderCompleteMock: vi.fn(),
  trackRenderMock: vi.fn(),
}));

vi.mock('./renderTracker.util', () => ({
  trackRender: trackRenderMock,
  trackRenderComplete: trackRenderCompleteMock,
}));

import { useRenderTracker } from './useRenderTracker.hook';

describe('useRenderTracker', () => {
  afterEach(() => {
    trackRenderCompleteMock.mockReset();
    trackRenderMock.mockReset();
    vi.restoreAllMocks();
  });

  it('tracks renders and render completion when enabled', () => {
    const { rerender } = renderHook(
      ({ componentName }: { readonly componentName: string }) =>
        useRenderTracker({ componentName }),
      {
        initialProps: { componentName: 'OrdersTable' },
      },
    );

    expect(trackRenderMock).toHaveBeenCalledWith('OrdersTable');
    expect(trackRenderCompleteMock).toHaveBeenCalledTimes(1);

    rerender({ componentName: 'OrdersTable' });

    expect(trackRenderMock).toHaveBeenCalledTimes(2);
    expect(trackRenderCompleteMock).toHaveBeenCalledTimes(2);
  });

  it('does not track renders when disabled', () => {
    renderHook(() =>
      useRenderTracker({
        componentName: 'OrdersTable',
        isEnabled: false,
      }),
    );

    expect(trackRenderMock).not.toHaveBeenCalled();
    expect(trackRenderCompleteMock).not.toHaveBeenCalled();
  });

  it('logs changed prop keys between renders', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const props = { density: 'compact', striped: false };
    const nextProps = { density: 'comfortable', striped: false };

    const { rerender } = renderHook(
      ({ logProps }: { readonly logProps: Record<string, unknown> }) =>
        useRenderTracker({
          componentName: 'OrdersTable',
          logProps,
        }),
      {
        initialProps: { logProps: props },
      },
    );

    rerender({ logProps: nextProps });

    expect(logSpy).toHaveBeenCalledWith(
      '[OrdersTable] Props changed:',
      'density',
    );
  });
});
