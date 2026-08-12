import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getNextStatePatch } from './getNextStatePatch.util';

describe('getNextStatePatch', () => {
  it('captures the table settings state when opening column settings', () => {
    const metaState = {
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    } as Partial<TableMetaState>;

    const result = getNextStatePatch({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      metaState,
    });

    expect(result).toEqual({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
  });

  it('preserves the existing snapshot when switching between column drawers', () => {
    const metaState = {
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getNextStatePatch({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      metaState,
    });

    expect(result).toEqual({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
  });

  it('preserves the existing snapshot when column settings are not opening', () => {
    const metaState = {
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getNextStatePatch({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      metaState,
    });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
  });
});
