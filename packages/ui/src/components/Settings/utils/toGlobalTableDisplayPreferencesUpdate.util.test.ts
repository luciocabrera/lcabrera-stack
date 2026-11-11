import { describe, expect, it } from 'vite-plus/test';

import { TABLE_SETTINGS_TAB_ROLES } from '#ui/components/Table/Table.constants';

import type { SettingsDraft } from '../Settings.types';

import { toGlobalTableDisplayPreferencesUpdate } from './toGlobalTableDisplayPreferencesUpdate.util';

const baseline: SettingsDraft = {
  groupFold: 'expanded',
  groupingMode: 'flat',
  navigationCollapsed: 'expanded',
  navigationSize: 'medium',
  orderConflictResolution: 'always-ask',
  pinConflictResolution: 'always-ask',
  pinSide: 'always-ask',
  settingsTabOrder: TABLE_SETTINGS_TAB_ROLES,
  tableDensity: 'compact',
  tableHeaderDensity: 'same-as-rows',
  totalsPlacement: 'last',
  unpinConflictResolution: 'always-ask',
};

describe('toGlobalTableDisplayPreferencesUpdate', () => {
  it('stores the levels the reader chose', () => {
    expect(
      toGlobalTableDisplayPreferencesUpdate({
        draft: {
          ...baseline,
          tableDensity: 'spacious',
          tableHeaderDensity: 'dense',
        },
      }),
    ).toStrictEqual({ density: 'spacious', headerDensity: 'dense' });
  });

  it('writes the shipped defaults back to undefined rather than storing them', () => {
    expect(
      toGlobalTableDisplayPreferencesUpdate({ draft: baseline }),
    ).toStrictEqual({ density: undefined, headerDensity: undefined });
  });
});
