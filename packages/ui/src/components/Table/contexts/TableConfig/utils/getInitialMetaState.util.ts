import type { TableMetaState } from '#ui/components/Table/Table.types';

import {
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  IS_PREFETCH_ENABLED,
  LOAD_MORE_PAGE_SIZE,
} from '#ui/components/Table/Table.constants';

type GetInitialMetaStateArgs = Partial<TableMetaState>;

export const getInitialMetaState = ({
  appId,
  columnSettingsSelectedTab = 'general',
  density = 'compact',
  drawersSyncNonce = 0,
  enablePrefetch = IS_PREFETCH_ENABLED,
  error,
  initialPageSize = INITIAL_PAGE_SIZE,
  isBordered = true,
  isColumnSettingsOpen = false,
  isColumnSettingsPinned = false,
  isRounded = false,
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
}: GetInitialMetaStateArgs) => {
  return {
    appId,
    columnSettingsSelectedTab,
    density,
    drawersSyncNonce,
    enablePrefetch,
    error,
    initialPageSize,
    isBordered,
    isColumnSettingsOpen,
    isColumnSettingsPinned,
    isRounded,
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
  };
};
