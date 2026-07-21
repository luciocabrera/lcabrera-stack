import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { getClosedColumnSettingsStatePatch } from './getClosedColumnSettingsStatePatch.util';

describe('getClosedColumnSettingsStatePatch', () => {
  it('restores table settings visibility from the takeover snapshot', () => {
    const metaState = {
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    } as Partial<TableMetaState>;

    const result = getClosedColumnSettingsStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('keeps table settings closed when there is no restore snapshot', () => {
    const metaState = {
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    } as Partial<TableMetaState>;

    const result = getClosedColumnSettingsStatePatch({ metaState });

    expect(result).toEqual({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });
});
