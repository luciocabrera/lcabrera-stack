import type { TableMetaState } from '@/components/Table/Table.types';

import {
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_OVERSCAN,
  DEFAULT_PLACEHOLDER_ROW_COUNT,
  DEFAULT_ROW_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
} from '@/components/Table/Table.constants';

type GetInitialMetaStateArgs = Partial<TableMetaState>;

export const getInitialMetaState = ({
  columnOverscan = DEFAULT_COLUMN_OVERSCAN,
  density = 'compact',
  error,
  initialPageSize = INITIAL_PAGE_SIZE,
  isBordered = true,
  isColumnSettingsOpen = false,
  isStriped = true,
  isTableSettingsOpen = false,
  loadMorePageSize = LOAD_MORE_PAGE_SIZE,
  overscan = DEFAULT_OVERSCAN,
  persistenceKey = '',
  placeholderRowCount = DEFAULT_PLACEHOLDER_ROW_COUNT,
  rowHeight = DEFAULT_ROW_HEIGHT,
  threshold = INFINITE_SCROLL_THRESHOLD,
  ...rest
}: GetInitialMetaStateArgs): TableMetaState => ({
  columnOverscan,
  density,
  error,
  initialPageSize,
  isBordered,
  isColumnSettingsOpen,
  isStriped,
  isTableSettingsOpen,
  loadMorePageSize,
  overscan,
  persistenceKey,
  placeholderRowCount,
  rowHeight,
  threshold,
  ...rest,
});
