import { describe, expect, it } from 'vite-plus/test';

import type { TableChromeState } from '../Table.types';

import { getPersistedUiState } from './getPersistedUiState.util';

describe('getPersistedUiState', () => {
  it('extracts only the persisted UI fields from chrome and placement', () => {
    const chrome = {
      columnSelectedKey: 'status',
      columnSettingsSelectedTab: 'general',
      density: 'compact',
      drawersSyncNonce: 1,
      initialPageSize: 20,
      isBordered: true,
      isColumnSettingsOpen: true,
      isColumnSettingsPinned: false,
      isRounded: true,
      isStriped: true,
      isTableSettingsOpen: false,
      isTableSettingsPinned: true,
      loadMorePageSize: 50,
      overscan: 4,
      persistenceKey: 'orders',
      placeholderRowCount: 8,
      rowHeight: 44,
      settingsPanelWidth: 420,
      tableSettingsExpandedFilters: ['status'],
      tableSettingsSelectedTab: 'filters',
      threshold: 200,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } satisfies TableChromeState;

    expect(getPersistedUiState({ chrome, totalsPlacement: 'first' })).toEqual({
      columnSettingsSelectedTab: 'general',
      isColumnSettingsOpen: true,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: false,
      isTableSettingsPinned: true,
      settingsPanelWidth: 420,
      tableSettingsExpandedFilters: ['status'],
      tableSettingsSelectedTab: 'filters',
      totalsPlacement: 'first',
    });
  });

  it('returns an empty persisted slice when nothing is passed', () => {
    expect(getPersistedUiState()).toEqual({
      columnSettingsSelectedTab: undefined,
      isColumnSettingsOpen: undefined,
      isColumnSettingsPinned: undefined,
      isTableSettingsOpen: undefined,
      isTableSettingsPinned: undefined,
      settingsPanelWidth: undefined,
      tableSettingsExpandedFilters: undefined,
      tableSettingsSelectedTab: undefined,
      totalsPlacement: undefined,
    });
  });
});
