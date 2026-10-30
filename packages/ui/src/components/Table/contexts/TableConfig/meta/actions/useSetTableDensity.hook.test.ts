// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { metaStoreSetMock } = vi.hoisted(() => ({
  metaStoreSetMock: vi.fn(),
}));

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: () => ({
    metaStore: { get: () => ({}), set: metaStoreSetMock },
  }),
}));

import { useSetTableDensity } from './useSetTableDensity.hook';

describe('useSetTableDensity', () => {
  it('writes the chosen level to the meta store and nothing else', () => {
    const { result } = renderHook(() => useSetTableDensity());

    act(() => {
      result.current('spacious');
    });

    expect(metaStoreSetMock).toHaveBeenCalledExactlyOnceWith({
      density: 'spacious',
    });
  });
});
