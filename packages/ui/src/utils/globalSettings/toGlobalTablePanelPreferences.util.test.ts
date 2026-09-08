import { describe, expect, it } from 'vite-plus/test';

import { TABLE_SETTINGS_TAB_ROLES } from '#ui/components/Table/Table.constants';

import { toGlobalTablePanelPreferences } from './toGlobalTablePanelPreferences.util';

describe('toGlobalTablePanelPreferences', () => {
  it('returns nothing for a value that is not an object', () => {
    expect(toGlobalTablePanelPreferences('sorting')).toBeUndefined();
  });

  it('leaves the order unstated when the payload names none', () => {
    expect(toGlobalTablePanelPreferences({})).toEqual({
      settingsTabOrder: undefined,
    });
  });

  it('keeps a stored order and appends the roles it did not name', () => {
    expect(
      toGlobalTablePanelPreferences({ settingsTabOrder: ['details'] })
        ?.settingsTabOrder?.[0],
    ).toBe('details');
  });

  it('drops a name that is not a role', () => {
    expect(
      toGlobalTablePanelPreferences({
        settingsTabOrder: ['nonsense'],
      })?.settingsTabOrder,
    ).toStrictEqual([...TABLE_SETTINGS_TAB_ROLES]);
  });
});
