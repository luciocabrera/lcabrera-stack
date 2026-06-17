// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

import {
  createMockStore,
  type MockStore,
} from '@/utils/tests/createMockStore.util';

let settingsStore: MockStore<GlobalSettingsState | undefined> = createMockStore<
  GlobalSettingsState | undefined
>(undefined);

vi.mock('./useGlobalSettingsContextValue.hook', () => ({
  useGlobalSettingsContextValue: () => ({
    settingsStore: settingsStore as never,
  }),
}));

import { useGlobalSettingsStore } from './useGlobalSettingsStore.hook';

describe('useGlobalSettingsStore', () => {
  beforeEach(() => {
    settingsStore = createMockStore<GlobalSettingsState | undefined>({
      navigation: {
        collapsed: 'expanded',
        size: 'small',
      },
      pinning: {
        pinSide: 'left',
      },
    });
  });

  it('subscribes to store updates and returns the selected value', () => {
    const { result } = renderHook(() =>
      useGlobalSettingsStore((state) => state.navigation.size ?? 'medium'),
    );

    expect(result.current).toBe('small');

    act(() => {
      settingsStore.set({
        navigation: {
          collapsed: 'expanded',
          size: 'large',
        },
      });
    });

    expect(result.current).toBe('large');
  });

  it('falls back to initial global settings when snapshot is undefined', () => {
    settingsStore = createMockStore<GlobalSettingsState | undefined>(undefined);

    const { result } = renderHook(() =>
      useGlobalSettingsStore((state) => state.navigation.size ?? 'medium'),
    );

    expect(result.current).toBe('medium');
  });
});
