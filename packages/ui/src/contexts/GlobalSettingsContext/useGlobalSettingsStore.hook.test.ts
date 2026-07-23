// @vitest-environment jsdom

import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import {
  createMockStore,
  type MockStore,
} from '@lcabrera/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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
