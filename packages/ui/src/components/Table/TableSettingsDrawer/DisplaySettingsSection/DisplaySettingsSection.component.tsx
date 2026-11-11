import { use } from 'react';

import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';
import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { TABLE_DENSITY_LABELS } from '#ui/components/Table/Table.constants';
import { resolveTableDensity } from '#ui/components/Table/utils/resolveTableDensity.util';

import type { DisplaySettingsSectionProps } from './DisplaySettingsSection.types';

import {
  useSetDensity,
  useSetHeaderDensity,
} from '../TableDrawerContext/actions';
import {
  useGetDensity,
  useGetHeaderDensity,
} from '../TableDrawerContext/selectors';
import { ColumnWidthsSection } from './ColumnWidthsSection/ColumnWidthsSection.component';
import { DensitySection } from './DensitySection/DensitySection.component';
import { TitleBarDensitySection } from './TitleBarDensitySection/TitleBarDensitySection.component';
import { toFollowsRowsLabel } from './toFollowsRowsLabel.util';

export const DisplaySettingsSection = ({
  isBusy = false,
  ...props
}: DisplaySettingsSectionProps) => {
  const defaults = use(TableDensityContext);
  const density = useGetDensity();
  const headerDensity = useGetHeaderDensity();
  const setDensity = useSetDensity();
  const setHeaderDensity = useSetHeaderDensity();
  const defaultDensity = resolveTableDensity({ defaults, state: {} }).density;

  return (
    <SidePanelSectionMain {...props}>
      <ColumnWidthsSection isBusy={isBusy} />

      <InfoBox>
        Select a preset to adjust all column widths at once. Changes will be
        reflected after clicking Accept.
      </InfoBox>

      <SidePanelSectionHeader title='Density' />

      <DensitySection
        defaultLabel={`Default (${TABLE_DENSITY_LABELS[defaultDensity]})`}
        heightSuffix='rows'
        isBusy={isBusy}
        name='table-density'
        onChange={setDensity}
        title='Rows'
        value={density}
      />

      <DensitySection
        defaultLabel={toFollowsRowsLabel(defaults.headerDensity)}
        heightSuffix='tall'
        isBusy={isBusy}
        name='table-header-density'
        onChange={setHeaderDensity}
        title='Column headers'
        value={headerDensity}
      />

      <TitleBarDensitySection isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
