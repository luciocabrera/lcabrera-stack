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

import { useSetGlobalTableDisplayPreferences } from './useSetGlobalTableDisplayPreferences.hook';

const EXPECTED: GlobalSettingsState = {
  grouping: {},
  navigation: { size: 'small' },
  pinning: {},
  tableDisplay: { density: 'dense', headerDensity: 'spacious' },
  tablePanel: {},
};

describe('useSetGlobalTableDisplayPreferences', () => {
  beforeEach(() => {
    persistGlobalSettingsMock.mockReset();
    settingsStoreRef.current = createMockStore<GlobalSettingsState | undefined>(
      {
        grouping: {},
        navigation: { size: 'small' },
        pinning: {},
        tableDisplay: { headerDensity: 'spacious' },
        tablePanel: {},
      },
    );
  });

  it('merges the update into the stored defaults and persists the snapshot', () => {
    const { result } = renderHook(() => useSetGlobalTableDisplayPreferences());

    act(() => {
      result.current({ density: 'dense' });
    });

    expect(settingsStoreRef.current.get()).toStrictEqual(EXPECTED);
    expect(persistGlobalSettingsMock).toHaveBeenCalledExactlyOnceWith(EXPECTED);
  });

  it('starts from the initial settings when the store holds none', () => {
    settingsStoreRef.current = createMockStore<GlobalSettingsState | undefined>(
      undefined,
    );
    const { result } = renderHook(() => useSetGlobalTableDisplayPreferences());

    act(() => {
      result.current({ density: 'comfortable' });
    });

    expect(settingsStoreRef.current.get()).toStrictEqual({
      grouping: {},
      navigation: {},
      pinning: {},
      tableDisplay: { density: 'comfortable' },
      tablePanel: {},
    });
  });
});
