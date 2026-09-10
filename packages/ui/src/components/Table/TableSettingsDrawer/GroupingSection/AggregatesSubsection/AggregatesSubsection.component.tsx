import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { AggregatesSubsectionProps } from './AggregatesSubsection.types';

import { ActiveAggregateList } from '../ActiveAggregateList';
import { AddAggregateSection } from '../AddAggregateSection';

export const AggregatesSubsection = ({
  isBusy = false,
}: AggregatesSubsectionProps) => {
  return (
    <SidePanelSectionMain>
      <AddAggregateSection isBusy={isBusy} />
      <ActiveAggregateList isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
