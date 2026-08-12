import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getIsTableSettingsOpen } from './getIsTableSettingsOpen.util';

describe('getIsTableSettingsOpen', () => {
  it('restores table settings when the column drawer borrowed its open state', () => {
    const metaState = {
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getIsTableSettingsOpen({ metaState });

    expect(result).toBe(true);
  });

  it('falls back to the current table settings open state', () => {
    const metaState = {
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    } as Partial<TableMetaState>;

    const result = getIsTableSettingsOpen({ metaState });

    expect(result).toBe(false);
  });
});
