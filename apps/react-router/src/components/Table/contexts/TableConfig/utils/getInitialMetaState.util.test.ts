import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_ENABLE_PREFETCH,
  DEFAULT_OVERSCAN,
  DEFAULT_PLACEHOLDER_ROW_COUNT,
  DEFAULT_ROW_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
} from '@/components/Table/Table.constants';

import { getInitialMetaState } from './getInitialMetaState.util';

describe('getInitialMetaState', () => {
  it('returns default values when no args provided', () => {
    const result = getInitialMetaState({});
    expect(result.columnOverscan).toBe(DEFAULT_COLUMN_OVERSCAN);
    expect(result.density).toBe('compact');
    expect(result.enablePrefetch).toBe(DEFAULT_ENABLE_PREFETCH);
    expect(result.isBordered).toBe(true);
    expect(result.isStriped).toBe(true);
    expect(result.isColumnSettingsOpen).toBe(false);
    expect(result.isColumnSettingsPinned).toBe(false);
    expect(result.isTableSettingsPinned).toBe(false);
    expect(result.isTableSettingsOpen).toBe(false);
    expect(result.initialPageSize).toBe(INITIAL_PAGE_SIZE);
    expect(result.loadMorePageSize).toBe(LOAD_MORE_PAGE_SIZE);
    expect(result.overscan).toBe(DEFAULT_OVERSCAN);
    expect(result.placeholderRowCount).toBe(DEFAULT_PLACEHOLDER_ROW_COUNT);
    expect(result.rowHeight).toBe(DEFAULT_ROW_HEIGHT);
    expect(result.tableSettingsExpandedFilters).toEqual([]);
    expect(result.tableSettingsSelectedTab).toBe('general');
    expect(result.threshold).toBe(INFINITE_SCROLL_THRESHOLD);
    expect(result.wasTableSettingsOpenBeforeColumnSettings).toBe(false);
    expect(result.persistenceKey).toBe('');
  });

  it('allows overriding individual fields', () => {
    const result = getInitialMetaState({
      columnOverscan: 4,
      density: 'comfortable',
      enablePrefetch: true,
      isBordered: false,
    });
    expect(result.columnOverscan).toBe(4);
    expect(result.density).toBe('comfortable');
    expect(result.enablePrefetch).toBe(true);
    expect(result.isBordered).toBe(false);
  });

  it('passes through extra fields', () => {
    const result = getInitialMetaState({ persistenceKey: 'myTable' });
    expect(result.persistenceKey).toBe('myTable');
  });
});
