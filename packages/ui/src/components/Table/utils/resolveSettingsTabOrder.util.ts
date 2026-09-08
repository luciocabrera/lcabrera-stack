import type { TableSettingsTabRole } from '../Table.types';

import { TABLE_SETTINGS_TAB_ROLES } from '../Table.constants';

const isSettingsTabRole = (value: unknown): value is TableSettingsTabRole =>
  TABLE_SETTINGS_TAB_ROLES.includes(value as TableSettingsTabRole);

export const resolveSettingsTabOrder = (order: unknown) => {
  const stored: readonly unknown[] = Array.isArray(order) ? order : [];
  const declared = [...new Set(stored)].filter(isSettingsTabRole);
  const stated = new Set<string>(declared);

  return [
    ...declared,
    ...TABLE_SETTINGS_TAB_ROLES.filter((role) => !stated.has(role)),
  ];
};
