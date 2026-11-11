import * as stylex from '@stylexjs/stylex';

import {
  TABLE_DENSITY_PREFERENCE_OPTIONS,
  TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS,
} from '#ui/constants/tableDisplayPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';
import { SettingsOptionSection } from '../SettingsOptionSection';

export const TableDisplaySettingsTab = () => {
  const draft = useGetSettingsDraft();
  const setSettingsDraftField = useSetSettingsDraftField();

  const handleTableDensityChange = (value: SettingsDraft['tableDensity']) => {
    setSettingsDraftField({ key: 'tableDensity', value });
  };

  const handleTableHeaderDensityChange = (
    value: SettingsDraft['tableHeaderDensity'],
  ) => {
    setSettingsDraftField({ key: 'tableHeaderDensity', value });
  };

  return (
    <div {...stylex.props(styles.tabSections)}>
      <SettingsOptionSection
        description='How tall each table row is. A table that sets its own density, or one you changed in its settings, keeps that one.'
        name='settings-table-density-preference'
        onChange={handleTableDensityChange}
        options={TABLE_DENSITY_PREFERENCE_OPTIONS}
        title='Row Density'
        value={draft.tableDensity}
      />

      <SettingsOptionSection
        description='How tall the header row is. A table that sets its own header density, or one you changed in its settings, keeps that one.'
        name='settings-table-header-density-preference'
        onChange={handleTableHeaderDensityChange}
        options={TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS}
        title='Header Density'
        value={draft.tableHeaderDensity}
      />
    </div>
  );
};
