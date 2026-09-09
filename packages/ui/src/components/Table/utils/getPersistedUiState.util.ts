import type { TableChromeState, TableTotalsPlacement } from '../Table.types';

type GetPersistedUiStateArgs = {
  readonly chrome?: Partial<TableChromeState>;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export const getPersistedUiState = ({
  chrome,
  totalsPlacement,
}: GetPersistedUiStateArgs = {}) => ({
  columnSettingsSelectedTab: chrome?.columnSettingsSelectedTab,
  isColumnSettingsOpen: chrome?.isColumnSettingsOpen,
  isColumnSettingsPinned: chrome?.isColumnSettingsPinned,
  isTableSettingsOpen: chrome?.isTableSettingsOpen,
  isTableSettingsPinned: chrome?.isTableSettingsPinned,
  settingsPanelWidth: chrome?.settingsPanelWidth,
  tableSettingsExpandedFilters: chrome?.tableSettingsExpandedFilters,
  tableSettingsSelectedTab: chrome?.tableSettingsSelectedTab,
  totalsPlacement,
});
