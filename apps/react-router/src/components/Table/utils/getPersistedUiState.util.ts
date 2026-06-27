import type { TableMetaState } from '../Table.types';
import type { PersistedUiState } from './persistence.types';

/**
 * Extracts the tab-scoped UI persistence slice from the full meta store state.
 */
export const getPersistedUiState = (
  state: TableMetaState | undefined,
): PersistedUiState => ({
  columnSettingsSelectedTab: state?.columnSettingsSelectedTab,
  isColumnSettingsOpen: state?.isColumnSettingsOpen,
  isColumnSettingsPinned: state?.isColumnSettingsPinned,
  isTableSettingsOpen: state?.isTableSettingsOpen,
  isTableSettingsPinned: state?.isTableSettingsPinned,
  tableSettingsExpandedFilters: state?.tableSettingsExpandedFilters,
  tableSettingsSelectedTab: state?.tableSettingsSelectedTab,
});
