// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

import {
  createMockStore,
  type MockStore,
} from '@/utils/tests/createMockStore.util';

const settingsStoreRef: {
  current: MockStore<GlobalSettingsState | undefined>;
} = {
  current: createMockStore<GlobalSettingsState | undefined>(undefined),
};

const persistGlobalSettingsMock = vi.hoisted(() => vi.fn());

vi.mock('../useGlobalSettingsContextValue.hook', () => ({
  useGlobalSettingsContextValue: () => ({
    settingsStore: settingsStoreRef.current as never,
  }),
}));

vi.mock('./usePersistGlobalSettingsAction.hook', () => ({
  usePersistGlobalSettingsAction: () => persistGlobalSettingsMock,
}));

import { useSetGlobalPinningPreferences } from './useSetGlobalPinningPreferences.hook';

describe('useSetGlobalPinningPreferences', () => {
  beforeEach(() => {
    persistGlobalSettingsMock.mockReset();
    settingsStoreRef.current = createMockStore<GlobalSettingsState | undefined>(
      {
        navigation: { size: 'small' },
        pinning: {
          orderConflictResolution: 'reset-all-pins',
          pinSide: 'left',
        },
      },
    );
  });

  it('merges pinning updates and persists the next global settings snapshot', () => {
    const { result } = renderHook(() => useSetGlobalPinningPreferences());

    act(() => {
      result.current({ pinSide: 'right' });
    });

    expect(settingsStoreRef.current.get()).toEqual({
      navigation: { size: 'small' },
      pinning: {
        orderConflictResolution: 'reset-all-pins',
        pinSide: 'right',
      },
    });
    expect(persistGlobalSettingsMock).toHaveBeenCalledTimes(1);
    expect(persistGlobalSettingsMock).toHaveBeenCalledWith({
      navigation: { size: 'small' },
      pinning: {
        orderConflictResolution: 'reset-all-pins',
        pinSide: 'right',
      },
    });
  });

  it('uses initial settings when the store snapshot is undefined', () => {
    settingsStoreRef.current = createMockStore<GlobalSettingsState | undefined>(
      undefined,
    );

    const { result } = renderHook(() => useSetGlobalPinningPreferences());

    act(() => {
      result.current({ pinConflictResolution: 'pin-only' });
    });

    expect(settingsStoreRef.current.get()).toEqual({
      navigation: {},
      pinning: {
        pinConflictResolution: 'pin-only',
      },
    });
    expect(persistGlobalSettingsMock).toHaveBeenCalledWith({
      navigation: {},
      pinning: {
        pinConflictResolution: 'pin-only',
      },
    });
  });
});
