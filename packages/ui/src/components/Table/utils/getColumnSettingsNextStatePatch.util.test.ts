import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getColumnSettingsNextStatePatch } from './getColumnSettingsNextStatePatch.util';

describe('getColumnSettingsNextStatePatch', () => {
  it('keeps the column settings drawer open when it is pinned', () => {
    const metaState = {
      isColumnSettingsPinned: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getColumnSettingsNextStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: true,
    });
  });

  it('closes the column drawer and restores table settings when needed', () => {
    const metaState = {
      isColumnSettingsPinned: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getColumnSettingsNextStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });
});
