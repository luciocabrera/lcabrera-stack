import { use } from 'react';

import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionMain } from '#ui/components/SidePanel';
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
  const headerDefaultLabel =
    defaults.headerDensity === undefined
      ? 'Same as rows'
      : `Default (${TABLE_DENSITY_LABELS[defaults.headerDensity]})`;

  return (
    <SidePanelSectionMain {...props}>
      <ColumnWidthsSection isBusy={isBusy} />

      <InfoBox>
        Select a preset to adjust all column widths at once. Changes will be
        reflected after clicking Accept.
      </InfoBox>

      <DensitySection
        defaultLabel={`Default (${TABLE_DENSITY_LABELS[defaultDensity]})`}
        isBusy={isBusy}
        name='table-density'
        onChange={setDensity}
        title='Row Density'
        value={density}
      />

      <DensitySection
        defaultLabel={headerDefaultLabel}
        isBusy={isBusy}
        name='table-header-density'
        onChange={setHeaderDensity}
        title='Header Density'
        value={headerDensity}
      />
    </SidePanelSectionMain>
  );
};
