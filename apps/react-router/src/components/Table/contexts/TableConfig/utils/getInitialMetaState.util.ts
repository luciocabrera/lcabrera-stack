import type { TableMetaState } from '@/components/Table/Table.types';

import {
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  IS_PREFETCH_ENABLE,
  LOAD_MORE_PAGE_SIZE,
} from '@/components/Table/Table.constants';
import { readPersistedUiStateFromSessionStorage } from '@/components/Table/utils';

type GetInitialMetaStateArgs = Partial<TableMetaState>;

export const getInitialMetaState = ({
  columnOverscan = DEFAULT_COLUMN_OVERSCAN,
  columnSettingsSelectedTab = 'general',
  density = 'compact',
  drawersSyncNonce = 0,
  enablePrefetch = IS_PREFETCH_ENABLE,
  error,
  initialPageSize = INITIAL_PAGE_SIZE,
  isBordered = true,
  isColumnSettingsOpen = false,
  isColumnSettingsPinned = false,
  isStriped = true,
  isTableSettingsOpen = false,
  isTableSettingsPinned = false,
  loadMorePageSize = LOAD_MORE_PAGE_SIZE,
  overscan = DEFAULT_OVERSCAN,
  persistenceKey = '',
  placeholderRowCount = INITIAL_PAGE_SIZE,
  rowHeight = DEFAULT_ROW_HEIGHT,
  tableSettingsExpandedFilters = [],
  tableSettingsSelectedTab = 'general',
  threshold = INFINITE_SCROLL_THRESHOLD,
  wasTableSettingsOpenBeforeColumnSettings = false,
  ...rest
}: GetInitialMetaStateArgs): TableMetaState => {
  const uiState = readPersistedUiStateFromSessionStorage({
    persistenceKey,
  });

  return {
    columnOverscan,
    columnSettingsSelectedTab,
    density,
    drawersSyncNonce,
    enablePrefetch,
    error,
    initialPageSize,
    isBordered,
    isColumnSettingsOpen,
    isColumnSettingsPinned,
    isStriped,
    isTableSettingsOpen,
    isTableSettingsPinned,
    loadMorePageSize,
    overscan,
    persistenceKey,
    placeholderRowCount,
    rowHeight,
    tableSettingsExpandedFilters,
    tableSettingsSelectedTab,
    threshold,
    wasTableSettingsOpenBeforeColumnSettings,
    ...rest,
    ...uiState,
  };
};
