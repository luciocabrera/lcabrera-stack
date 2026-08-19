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
 * The settings drawer's grouping tab: the staged group keys in nesting order,
 * the staged aggregates, the totals mode and position, and the controls to add
 * either.
 *
 * Structurally the sorting section's twin — `SidePanelSectionMain`, an add
 * control, an overlay-guarded list, a toolbar — because it is the same kind of
 * thing and the drawer-section pattern is what makes the drawer read as one
 * surface rather than five.
 *
 * Every control here writes the drawer's grouping **draft**, like every other
 * section, and Accept commits the whole configuration in one navigation. The
 * column-header grouping menu is the surface that still applies immediately:
 * it is a direct action with no Accept to wait for.
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
