/**
 * Narrows a parsed UI-flags payload to the keys `PersistedUiState` declares.
 *
 * `parseVersionedPayload` casts rather than checks, so a key this type has
 * dropped still reaches the meta store from a cookie written by an older
 * release. Picking the declared keys is what makes the type true of the value.
 *
 * The roster is a `Record<keyof PersistedUiState, true>` rather than an array so
 * that a key added to the type without being added here fails the build, rather
 * than being dropped from every cookie read in silence.
 */

import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { PersistedUiState } from './persistence.types';

const PERSISTED_UI_STATE_KEYS: Record<keyof PersistedUiState, true> = {
  columnSettingsSelectedTab: true,
  isColumnSettingsOpen: true,
  isColumnSettingsPinned: true,
  isTableSettingsOpen: true,
  isTableSettingsPinned: true,
  settingsPanelWidth: true,
  tableSettingsExpandedFilters: true,
  tableSettingsSelectedTab: true,
  totalsPlacement: true,
};

export const toPersistedUiState = (value: unknown): PersistedUiState => {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.keys(PERSISTED_UI_STATE_KEYS)
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, value[key]]),
  );
};
