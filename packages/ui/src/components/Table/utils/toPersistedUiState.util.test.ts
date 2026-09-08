import { describe, expect, it } from 'vite-plus/test';

import { toPersistedUiState } from './toPersistedUiState.util';

describe('toPersistedUiState', () => {
  it('answers an empty state for a payload that is not an object', () => {
    expect(toPersistedUiState('sorting')).toStrictEqual({});
  });

  it('keeps every key the type declares', () => {
    expect(
      toPersistedUiState({
        isTableSettingsPinned: true,
        settingsPanelWidth: 420,
        tableSettingsSelectedTab: 'sorting',
      }),
    ).toStrictEqual({
      isTableSettingsPinned: true,
      settingsPanelWidth: 420,
      tableSettingsSelectedTab: 'sorting',
    });
  });

  it('drops a key a previous release wrote and this one no longer declares', () => {
    expect(
      toPersistedUiState({
        settingsTabOrder: ['details'],
        tableSettingsSelectedTab: 'sorting',
      }),
    ).toStrictEqual({ tableSettingsSelectedTab: 'sorting' });
  });

  it('states no key for a value the payload left out', () => {
    expect(toPersistedUiState({ settingsPanelWidth: undefined })).toStrictEqual(
      {},
    );
  });
});
