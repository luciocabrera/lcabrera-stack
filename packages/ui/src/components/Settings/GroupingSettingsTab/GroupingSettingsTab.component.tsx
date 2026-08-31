import * as stylex from '@stylexjs/stylex';

import {
  GROUP_FOLD_PREFERENCE_OPTIONS,
  GROUPING_MODE_PREFERENCE_OPTIONS,
  TOTALS_PLACEMENT_PREFERENCE_OPTIONS,
} from '#ui/constants/groupingPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';
import { SettingsOptionSection } from '../SettingsOptionSection';

export const GroupingSettingsTab = () => {
  const draft = useGetSettingsDraft();
  const setSettingsDraftField = useSetSettingsDraftField();

  const handleGroupingModeChange = (value: SettingsDraft['groupingMode']) => {
    setSettingsDraftField({ key: 'groupingMode', value });
  };

  const handleTotalsPlacementChange = (
    value: SettingsDraft['totalsPlacement'],
  ) => {
    setSettingsDraftField({ key: 'totalsPlacement', value });
  };

  const handleGroupFoldChange = (value: SettingsDraft['groupFold']) => {
    setSettingsDraftField({ key: 'groupFold', value });
  };

  return (
    <div {...stylex.props(styles.tabSections)}>
      <SettingsOptionSection
        description='Used when a table is grouped for the first time. A table already carrying a mode in its link keeps that one.'
        name='settings-grouping-mode-preference'
        onChange={handleGroupingModeChange}
        options={GROUPING_MODE_PREFERENCE_OPTIONS}
        title='Totals Mode'
        value={draft.groupingMode}
      />

      <SettingsOptionSection
        description='Where a subtotal row sits relative to the rows it totals. Only applies with subtotals switched on.'
        name='settings-totals-placement-preference'
        onChange={handleTotalsPlacementChange}
        options={TOTALS_PLACEMENT_PREFERENCE_OPTIONS}
        title='Totals Position'
        value={draft.totalsPlacement}
      />

      <SettingsOptionSection
        description='Which way a group sits before anyone has opened or closed it.'
        name='settings-group-fold-preference'
        onChange={handleGroupFoldChange}
        options={GROUP_FOLD_PREFERENCE_OPTIONS}
        title='Default Group Fold'
        value={draft.groupFold}
      />
    </div>
  );
};
