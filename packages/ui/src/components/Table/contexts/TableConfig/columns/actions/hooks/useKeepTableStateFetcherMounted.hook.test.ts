// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PERSIST_TABLE_STATE_FETCHER_KEY } from '#ui/constants/globalSettings.constants';

import { useKeepTableStateFetcherMounted } from './useKeepTableStateFetcherMounted.hook';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));

vi.mock('#ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: persistMock,
}));

describe('useKeepTableStateFetcherMounted', () => {
  it('subscribes to the table-state fetcher', () => {
    renderHook(() => useKeepTableStateFetcherMounted());

    expect(persistMock).toHaveBeenCalledWith({
      fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY,
    });
  });
});
