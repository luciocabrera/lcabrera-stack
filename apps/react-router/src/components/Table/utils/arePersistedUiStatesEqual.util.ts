import { areArraysEqual } from '@/utils/comparison';

import type { PersistedUiState } from './persistence.types';

type ArePersistedUiStatesEqualArgs = {
  readonly left: PersistedUiState;
  readonly right: PersistedUiState;
};

/**
 * Compares only the persisted UI slices in table meta state.
 */
export const arePersistedUiStatesEqual = ({
  left,
  right,
}: ArePersistedUiStatesEqualArgs): boolean => {
  return (
    left.columnSettingsSelectedTab === right.columnSettingsSelectedTab &&
    left.isColumnSettingsOpen === right.isColumnSettingsOpen &&
    left.isColumnSettingsPinned === right.isColumnSettingsPinned &&
    left.isTableSettingsOpen === right.isTableSettingsOpen &&
    left.isTableSettingsPinned === right.isTableSettingsPinned &&
    areArraysEqual({
      left: left.tableSettingsExpandedFilters,
      right: right.tableSettingsExpandedFilters,
    }) &&
    left.tableSettingsSelectedTab === right.tableSettingsSelectedTab
  );
};
