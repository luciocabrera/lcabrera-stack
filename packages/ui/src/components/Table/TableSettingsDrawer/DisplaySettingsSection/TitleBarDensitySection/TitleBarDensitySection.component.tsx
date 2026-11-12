import { use } from 'react';

import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';

import type { TitleBarDensitySectionProps } from './TitleBarDensitySection.types';

import { useSetTitleDensity } from '../../TableDrawerContext/actions';
import { useGetTitleDensity } from '../../TableDrawerContext/selectors';
import { DensitySection } from '../DensitySection/DensitySection.component';
import { toFollowsRowsLabel } from '../utils/toFollowsRowsLabel.util';

export const TitleBarDensitySection = ({
  isBusy = false,
}: TitleBarDensitySectionProps) => {
  const defaults = use(TableDensityContext);
  const { features } = use(TablePresentationContext);
  const titleDensity = useGetTitleDensity();
  const setTitleDensity = useSetTitleDensity();

  if (!features.toolbar) return;

  return (
    <DensitySection
      defaultLabel={toFollowsRowsLabel(defaults.titleDensity)}
      isBusy={isBusy}
      name='table-title-density'
      onChange={setTitleDensity}
      title='Title bar'
      value={titleDensity}
    />
  );
};
