import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '#ui/components/SidePanel';

import type { GroupingSectionProps } from './GroupingSection.types';

import { ActiveAggregateList } from './ActiveAggregateList';
import { ActiveGroupKeyList } from './ActiveGroupKeyList';
import { AddAggregateSection } from './AddAggregateSection';
import { AddGroupKeySection } from './AddGroupKeySection';
import { GroupingModeSection } from './GroupingModeSection';
import { GroupingSectionToolbar } from './GroupingSectionToolbar';
import { TotalsPlacementSection } from './TotalsPlacementSection';

/**
 * The settings drawer's grouping tab: the staged group keys in nesting order, the staged
 * aggregates, the totals mode and position, and the controls to add either.
 * Every control here writes the drawer's grouping **draft**, like every other section, and
 * Accept commits the whole configuration in one navigation.
 */
export const GroupingSection = ({ isBusy = false }: GroupingSectionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain>
      <AddGroupKeySection
        isBusy={isBusy}
        onDropdownOpenChange={setIsDropdownOpen}
      />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveGroupKeyList isBusy={isBusy} />
        <GroupingModeSection isBusy={isBusy} />
        <TotalsPlacementSection isBusy={isBusy} />
        <AddAggregateSection isBusy={isBusy} />
        <ActiveAggregateList isBusy={isBusy} />
        <GroupingSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
