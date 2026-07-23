// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const { useBackNavigate } = await import('./useBackNavigate.hook');

describe('useBackNavigate', () => {
  afterEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates back when the current history entry has an earlier in-app entry', () => {
    globalThis.history.replaceState({ idx: 2 }, '');

    const { result } = renderHook(() => useBackNavigate());
    result.current('/fallback');

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to the fallback when this is the first entry in the SPA session', () => {
    globalThis.history.replaceState({ idx: 0 }, '');

    const { result } = renderHook(() => useBackNavigate());
    result.current('/fallback');

    expect(mockNavigate).toHaveBeenCalledWith('/fallback');
  });

  it('navigates to the fallback when history.state carries no react-router idx at all', () => {
    globalThis.history.replaceState(undefined, '');

    const { result } = renderHook(() => useBackNavigate());
    result.current('/fallback');

    expect(mockNavigate).toHaveBeenCalledWith('/fallback');
  });
});
