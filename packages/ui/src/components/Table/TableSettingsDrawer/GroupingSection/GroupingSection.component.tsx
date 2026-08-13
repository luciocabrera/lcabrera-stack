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
import { GroupingSectionToolbar } from './GroupingSectionToolbar';

/**
 * The settings drawer's grouping tab: the applied group keys in nesting order,
 * the selected aggregates, and the controls to add either.
 *
 * Structurally the sorting section's twin — `SidePanelSectionMain`, an add
 * control, an overlay-guarded list, a toolbar — because it is the same kind of
 * thing and the drawer-section pattern is what makes the drawer read as one
 * surface rather than five.
 *
 * **It writes through the live grouping store, not through a drawer draft**,
 * and that is the one deliberate departure from the sorting section beside it.
 * The draft exists so a batch of *cookie-persisted* column state commits in one
 * write; grouping is URL state, and every change re-runs the loader by design
 * (ADR-061). Drafting it would mean the drawer showed a grouping the table was
 * not showing, which for a control that restates the query is a worse trade
 * than a navigation per edit.
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
        <AddAggregateSection isBusy={isBusy} />
        <ActiveAggregateList isBusy={isBusy} />
        <GroupingSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
