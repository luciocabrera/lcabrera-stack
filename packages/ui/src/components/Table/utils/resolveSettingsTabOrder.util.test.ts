import { describe, expect, it } from 'vite-plus/test';

import { TABLE_SETTINGS_TAB_ROLES } from '../Table.constants';
import { resolveSettingsTabOrder } from './resolveSettingsTabOrder.util';

describe('resolveSettingsTabOrder', () => {
  it('hands back the declared order when nothing is stored', () => {
    expect(resolveSettingsTabOrder(undefined)).toStrictEqual([
      ...TABLE_SETTINGS_TAB_ROLES,
    ]);
  });

  it('keeps the stored order and appends what it did not name', () => {
    expect(resolveSettingsTabOrder(['details', 'grouping'])).toStrictEqual([
      'details',
      'grouping',
      'general',
      'columns',
      'filters',
      'sorting',
      'advanced',
    ]);
  });

  it('drops a name that is not a tab of either drawer', () => {
    expect(resolveSettingsTabOrder(['nonsense', 'sorting'])[0]).toBe('sorting');
  });

  it('states a repeated role once', () => {
    expect(resolveSettingsTabOrder(['sorting', 'sorting'])).toHaveLength(
      TABLE_SETTINGS_TAB_ROLES.length,
    );
  });

  it('falls back to the declared order for what a cookie can hold but an order cannot be', () => {
    expect([
      resolveSettingsTabOrder(5),
      resolveSettingsTabOrder({}),
      resolveSettingsTabOrder('sorting'),
    ]).toStrictEqual([
      [...TABLE_SETTINGS_TAB_ROLES],
      [...TABLE_SETTINGS_TAB_ROLES],
      [...TABLE_SETTINGS_TAB_ROLES],
    ]);
  });
});
