import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import {
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  IS_PREFETCH_ENABLED,
  LOAD_MORE_PAGE_SIZE,
} from '@lcabrera/ui/components/Table/Table.constants';

type GetInitialMetaStateArgs = Partial<TableMetaState>;

/**
 * Builds the meta store's initial state. The drawer flags arrive from the
 * loader, which read them from the cookie — the only channel SSR can see — so
 * the drawer paints in its persisted state on the first frame rather than
 * popping open after hydration.
 */
export const getInitialMetaState = ({
  appId,
  columnOverscan = DEFAULT_COLUMN_OVERSCAN,
  columnSettingsSelectedTab = 'general',
  density = 'compact',
  drawersSyncNonce = 0,
  enablePrefetch = IS_PREFETCH_ENABLED,
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
}: GetInitialMetaStateArgs) => {
  return {
    appId,
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
  };
};
