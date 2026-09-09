import type { PersistedUiState } from './persistence.types';

type ChromeUiFlags = Omit<PersistedUiState, 'totalsPlacement'>;

const CHROME_UI_FLAG_KEYS: Record<keyof ChromeUiFlags, true> = {
  columnSettingsSelectedTab: true,
  isColumnSettingsOpen: true,
  isColumnSettingsPinned: true,
  isTableSettingsOpen: true,
  isTableSettingsPinned: true,
  settingsPanelWidth: true,
  tableSettingsExpandedFilters: true,
  tableSettingsSelectedTab: true,
};

export const toChromeUiFlags = (uiFlags: PersistedUiState): ChromeUiFlags =>
  Object.fromEntries(
    (Object.keys(CHROME_UI_FLAG_KEYS) as (keyof ChromeUiFlags)[])
      .filter((key) => uiFlags[key] !== undefined)
      .map((key) => [key, uiFlags[key]]),
  );
