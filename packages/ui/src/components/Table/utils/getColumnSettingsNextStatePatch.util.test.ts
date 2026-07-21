import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

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
