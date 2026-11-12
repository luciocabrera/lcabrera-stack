import * as stylex from '@stylexjs/stylex';

import { SectionCard } from '#ui/components/SectionCard';
import {
  TABLE_DENSITY_PREFERENCE_OPTIONS,
  TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS,
  TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS,
} from '#ui/constants/tableDisplayPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';
import { SettingsOptionGroup } from '../SettingsOptionGroup/SettingsOptionGroup.component';

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

  const handleTableTitleDensityChange = (
    value: SettingsDraft['tableTitleDensity'],
  ) => {
    setSettingsDraftField({ key: 'tableTitleDensity', value });
  };

  return (
    <div {...stylex.props(styles.tabSections)}>
      <SectionCard
        description='How tall each part of a table is. A table that sets its own density, or one you changed in its settings, keeps that one.'
        title='Density'
      >
        <div {...stylex.props(styles.tabSections)}>
          <SettingsOptionGroup
            name='settings-table-density-preference'
            onChange={handleTableDensityChange}
            options={TABLE_DENSITY_PREFERENCE_OPTIONS}
            title='Rows'
            value={draft.tableDensity}
          />

          <SettingsOptionGroup
            name='settings-table-header-density-preference'
            onChange={handleTableHeaderDensityChange}
            options={TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS}
            title='Column headers'
            value={draft.tableHeaderDensity}
          />

          <SettingsOptionGroup
            name='settings-table-title-density-preference'
            onChange={handleTableTitleDensityChange}
            options={TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS}
            title='Title bar'
            value={draft.tableTitleDensity}
          />
        </div>
      </SectionCard>
    </div>
  );
};
