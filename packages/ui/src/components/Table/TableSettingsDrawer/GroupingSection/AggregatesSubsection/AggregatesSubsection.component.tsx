import type { AggregatesSubsectionProps } from './AggregatesSubsection.types';

import { ActiveAggregateList } from '../ActiveAggregateList';
import { AddAggregateSection } from '../AddAggregateSection';

export const AggregatesSubsection = ({
  isBusy = false,
}: AggregatesSubsectionProps) => {
  return (
    <>
      <AddAggregateSection isBusy={isBusy} />
      <ActiveAggregateList isBusy={isBusy} />
    </>
  );
};
