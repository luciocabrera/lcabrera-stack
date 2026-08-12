import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getNextToggleColumnSettingsStatePatch } from './getNextToggleColumnSettingsStatePatch.util';

describe('getNextToggleColumnSettingsStatePatch', () => {
  it('closes table settings and captures its previous state when opening column settings', () => {
    const metaState = {
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    } as Partial<TableMetaState>;

    const result = getNextToggleColumnSettingsStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
  });

  it('restores table settings and clears the snapshot when closing column settings', () => {
    const metaState = {
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getNextToggleColumnSettingsStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });
});
