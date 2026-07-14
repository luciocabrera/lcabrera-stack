import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { getNextStatePatch } from './getNextStatePatch.util';

describe('getNextStatePatch', () => {
  it('keeps the column settings drawer open when it is pinned', () => {
    const metaState = {
      isColumnSettingsPinned: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getNextStatePatch({ metaState });

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

    const result = getNextStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });
});
