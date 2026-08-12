// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { GlobalSettingsState } from '#ui/types/globalSettings.types';
import type { MockStore } from '#ui/utils/tests/createMockStore.util';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

const settingsStoreRef: {
  current: MockStore<GlobalSettingsState | undefined>;
} = {
  current: createMockStore<GlobalSettingsState | undefined>(undefined),
};

vi.mock('./useGlobalSettingsContextValue.hook', () => ({
  useGlobalSettingsContextValue: () => ({
    settingsStore: settingsStoreRef.current as never,
  }),
}));

import { useGlobalSettingsStore } from './useGlobalSettingsStore.hook';

describe('useGlobalSettingsStore', () => {
  beforeEach(() => {
    settingsStoreRef.current = createMockStore<GlobalSettingsState | undefined>(
      {
        navigation: {
          collapsed: 'expanded',
          size: 'small',
        },
        pinning: {
          pinSide: 'left',
        },
      },
    );
  });

  it('subscribes to store updates and returns the selected value', () => {
    const { result } = renderHook(() =>
      useGlobalSettingsStore((state) => state.navigation.size ?? 'medium'),
    );

    expect(result.current).toBe('small');

    act(() => {
      settingsStoreRef.current.set({
        navigation: {
          collapsed: 'expanded',
          size: 'large',
        },
      });
    });

    expect(result.current).toBe('large');
  });
});
