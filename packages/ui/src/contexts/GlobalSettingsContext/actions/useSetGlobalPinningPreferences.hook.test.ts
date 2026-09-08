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
        grouping: {},
        navigation: { size: 'small' },
        pinning: {
          orderConflictResolution: 'reset-all-pins',
          pinSide: 'left',
        },
        tablePanel: {},
      },
    );
  });

  it('merges pinning updates and persists the next global settings snapshot', () => {
    const { result } = renderHook(() => useSetGlobalPinningPreferences());

    act(() => {
      result.current({ pinSide: 'right' });
    });

    expect(settingsStoreRef.current.get()).toEqual({
      grouping: {},
      navigation: { size: 'small' },
      pinning: {
        orderConflictResolution: 'reset-all-pins',
        pinSide: 'right',
      },
      tablePanel: {},
    });
    expect(persistGlobalSettingsMock).toHaveBeenCalledTimes(1);
    expect(persistGlobalSettingsMock).toHaveBeenCalledWith({
      grouping: {},
      navigation: { size: 'small' },
      pinning: {
        orderConflictResolution: 'reset-all-pins',
        pinSide: 'right',
      },
      tablePanel: {},
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
      grouping: {},
      navigation: {},
      pinning: {
        pinConflictResolution: 'pin-only',
      },
      tablePanel: {},
    });
    expect(persistGlobalSettingsMock).toHaveBeenCalledWith({
      grouping: {},
      navigation: {},
      pinning: {
        pinConflictResolution: 'pin-only',
      },
      tablePanel: {},
    });
  });
});
