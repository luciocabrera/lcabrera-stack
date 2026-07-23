// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { usePersistCookieAction } from './usePersistCookieAction.hook';

const { submitMock } = vi.hoisted(() => ({ submitMock: vi.fn() }));
const { mockUseFetcher, mockUseLocation } = vi.hoisted(() => ({
  mockUseFetcher: vi.fn(() => ({ submit: submitMock })),
  mockUseLocation: () => ({
    pathname: '/enterprise-orders',
    search: '?page=2',
  }),
}));

vi.mock('react-router', () => ({
  useFetcher: mockUseFetcher,
  useLocation: mockUseLocation,
}));

describe('usePersistCookieAction', () => {
  beforeEach(() => {
    submitMock.mockReset();
    mockUseFetcher.mockClear();
  });

  it('submits the entries as JSON with the current URL to the persist-cookie action', () => {
    const { result } = renderHook(() =>
      usePersistCookieAction({ fetcherKey: 'persist-x' }),
    );

    const entries = [
      { key: 'k', searchParamKey: '', searchParamValue: '', value: 'v' },
    ];

    act(() => {
      result.current(entries);
    });

    expect(submitMock).toHaveBeenCalledWith(
      {
        currentUrl: '/enterprise-orders?page=2',
        entries: JSON.stringify(entries),
      },
      { action: '/_action/persist-cookie', method: 'POST' },
    );
  });

  it('opens the fetcher under the provided stable key', () => {
    renderHook(() =>
      usePersistCookieAction({ fetcherKey: 'persist-column-sizing' }),
    );

    expect(mockUseFetcher).toHaveBeenCalledWith({
      key: 'persist-column-sizing',
    });
  });
});
