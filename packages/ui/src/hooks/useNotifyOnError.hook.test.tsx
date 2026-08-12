// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const notifyMock = vi.hoisted(() => vi.fn());

vi.mock('#ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notifyMock,
}));

import { useNotifyOnError } from './useNotifyOnError.hook';

describe('useNotifyOnError', () => {
  beforeEach(() => {
    notifyMock.mockClear();
  });

  it('calls notify on mount with the correct error args', () => {
    renderHook(() => useNotifyOnError(new Error('boom')));

    expect(notifyMock).toHaveBeenCalledOnce();
    expect(notifyMock).toHaveBeenCalledWith({
      durationMs: 10_000,
      message: 'Something went wrong.',
      title: 'Error occurred',
      variant: 'error',
    });
  });

  it('calls notify again when error identity changes', () => {
    const firstError = new Error('first');
    const secondError = new Error('second');

    const { rerender } = renderHook(
      ({ error }: { readonly error: unknown }) => useNotifyOnError(error),
      { initialProps: { error: firstError } },
    );

    expect(notifyMock).toHaveBeenCalledTimes(1);

    rerender({ error: secondError });

    expect(notifyMock).toHaveBeenCalledTimes(2);
  });

  it('does not call notify again when re-rendered with same error reference', () => {
    const error = new Error('stable');

    const { rerender } = renderHook(
      ({ err }: { readonly err: unknown }) => useNotifyOnError(err),
      { initialProps: { err: error } },
    );

    expect(notifyMock).toHaveBeenCalledTimes(1);

    rerender({ err: error });

    expect(notifyMock).toHaveBeenCalledTimes(1);
  });
});
