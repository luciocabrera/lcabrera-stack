import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '../Table.types';

import { getPersistedUiState } from './getPersistedUiState.util';

describe('getPersistedUiState', () => {
  it('extracts only the persisted UI fields from table meta state', () => {
    const state = {
      columnOverscan: 2,
      columnSelectedKey: 'status',
      columnSettingsSelectedTab: 'general',
      density: 'compact',
      drawersSyncNonce: 1,
      enablePrefetch: true,
      error: 'Failed to load',
      initialPageSize: 20,
      isBordered: true,
      isColumnSettingsOpen: true,
      isColumnSettingsPinned: false,
      isStriped: true,
      isTableSettingsOpen: false,
      isTableSettingsPinned: true,
      loadMorePageSize: 50,
      overscan: 4,
      persistenceKey: 'orders',
      placeholderRowCount: 8,
      rowHeight: 44,
      tableSettingsExpandedFilters: ['status'],
      tableSettingsSelectedTab: 'filters',
      threshold: 200,
      title: {
        plural: 'Orders',
        singular: 'Order',
      },
      wasTableSettingsOpenBeforeColumnSettings: true,
    } satisfies TableMetaState;

    expect(getPersistedUiState(state)).toEqual({
      columnSettingsSelectedTab: 'general',
      isColumnSettingsOpen: true,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: false,
      isTableSettingsPinned: true,
      tableSettingsExpandedFilters: ['status'],
      tableSettingsSelectedTab: 'filters',
    });
  });

  it('returns an empty persisted slice for undefined meta state', () => {
    expect(getPersistedUiState(undefined)).toEqual({
      columnSettingsSelectedTab: undefined,
      isColumnSettingsOpen: undefined,
      isColumnSettingsPinned: undefined,
      isTableSettingsOpen: undefined,
      isTableSettingsPinned: undefined,
      tableSettingsExpandedFilters: undefined,
      tableSettingsSelectedTab: undefined,
    });
  });
});
