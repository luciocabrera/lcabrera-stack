import { describe, expect, it } from 'vite-plus/test';

import { TABLE_SETTINGS_TAB_ROLES } from '#ui/components/Table/Table.constants';

import type { SettingsDraft } from '../Settings.types';

import { toGlobalTablePanelPreferencesUpdate } from './toGlobalTablePanelPreferencesUpdate.util';

const draft = {
  settingsTabOrder: TABLE_SETTINGS_TAB_ROLES,
} as SettingsDraft;

describe('toGlobalTablePanelPreferencesUpdate', () => {
  it('writes the order back to undefined when it is the declared one', () => {
    expect(toGlobalTablePanelPreferencesUpdate({ draft })).toEqual({
      settingsTabOrder: undefined,
    });
  });

  it('states an order the reader arranged', () => {
    const arranged = [...TABLE_SETTINGS_TAB_ROLES].toReversed();

    expect(
      toGlobalTablePanelPreferencesUpdate({
        draft: { ...draft, settingsTabOrder: arranged },
      }),
    ).toEqual({ settingsTabOrder: arranged });
  });
});
