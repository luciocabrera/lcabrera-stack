import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '#ui/components/SidePanel';

import type { FiltersSectionProps } from './FiltersSection.types';

import { ActiveFiltersList } from './ActiveFiltersList';
import { AddFilterSection } from './AddFilterSection';
import { FiltersSectionToolbar } from './FiltersSectionToolbar';
import { LockedFiltersList } from './LockedFiltersList';

export const FiltersSection = ({ isBusy = false }: FiltersSectionProps) => {
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

  return (
    <SidePanelSectionMain>
      <AddFilterSection
        isBusy={isBusy}
        onDropdownOpenChange={setIsAddFilterOpen}
      />
      <SidePanelSectionOverlay isOpen={isAddFilterOpen}>
        {/* Above the reader's own filters, because it is the frame they are
            being read inside: the entries below narrow this set, they do not
            sit beside it. It renders nothing at all on a table with no
            restriction, which is every ordinary one. */}
        <LockedFiltersList />
        <ActiveFiltersList isBusy={isBusy} />
        <FiltersSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
