import { describe, expect, it } from 'vite-plus/test';

import type { TabItem } from '#ui/components/Tabs';

import {
  TABLE_SETTINGS_TAB_ROLE_BY_KEY,
  TABLE_SETTINGS_TAB_ROLES,
} from '../Table.constants';
import { orderSettingsTabs } from './orderSettingsTabs.util';
import { resolveSettingsTabOrder } from './resolveSettingsTabOrder.util';

const tabNamed = (name: string): TabItem => ({
  children: name,
  header: name,
  key: name,
});

const keysOf = (tabs: readonly TabItem[]) => tabs.map(({ key }) => key);

describe('orderSettingsTabs', () => {
  it('maps every settings role from a tab keyed by its own name', () => {
    expect(
      TABLE_SETTINGS_TAB_ROLES.filter(
        (role) => TABLE_SETTINGS_TAB_ROLE_BY_KEY[role] !== role,
      ),
    ).toStrictEqual([]);
  });

  it('moves the Display tab to where the reader put it', () => {
    const ordered = orderSettingsTabs({
      order: resolveSettingsTabOrder(['display', 'general']),
      tabs: [tabNamed('general'), tabNamed('details'), tabNamed('display')],
    });

    expect(keysOf(ordered)).toStrictEqual(['display', 'general', 'details']);
  });

  it('paints the drawer tabs in the stored order', () => {
    const ordered = orderSettingsTabs({
      order: resolveSettingsTabOrder(['details', 'general']),
      tabs: [tabNamed('general'), tabNamed('filters'), tabNamed('details')],
    });

    expect(keysOf(ordered)).toStrictEqual(['details', 'general', 'filters']);
  });

  it('ranks a column drawer tab by the role it fills', () => {
    const ordered = orderSettingsTabs({
      order: resolveSettingsTabOrder(undefined),
      tabs: [
        tabNamed('details'),
        tabNamed('sorting'),
        tabNamed('filter'),
        tabNamed('pinning'),
      ],
    });

    expect(keysOf(ordered)).toStrictEqual([
      'pinning',
      'filter',
      'sorting',
      'details',
    ]);
  });

  it('sends a tab filling no known role to the end, in the order it was given', () => {
    const ordered = orderSettingsTabs({
      order: resolveSettingsTabOrder(undefined),
      tabs: [tabNamed('mystery'), tabNamed('other'), tabNamed('general')],
    });

    expect(keysOf(ordered)).toStrictEqual(['general', 'mystery', 'other']);
  });

  it('leaves the given list untouched', () => {
    const tabs = [tabNamed('details'), tabNamed('general')];

    orderSettingsTabs({ order: resolveSettingsTabOrder(undefined), tabs });

    expect(keysOf(tabs)).toStrictEqual(['details', 'general']);
  });
});
