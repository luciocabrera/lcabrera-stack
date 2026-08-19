import type { TableMetaState } from '../Table.types';

/**
 * Extracts the tab-scoped UI persistence slice from the full meta store state.
 */
export const getPersistedUiState = (state: TableMetaState | undefined) => ({
  columnSettingsSelectedTab: state?.columnSettingsSelectedTab,
  isColumnSettingsOpen: state?.isColumnSettingsOpen,
  isColumnSettingsPinned: state?.isColumnSettingsPinned,
  isTableSettingsOpen: state?.isTableSettingsOpen,
  isTableSettingsPinned: state?.isTableSettingsPinned,
  tableSettingsExpandedFilters: state?.tableSettingsExpandedFilters,
  tableSettingsSelectedTab: state?.tableSettingsSelectedTab,
  totalsPlacement: state?.totalsPlacement,
});
