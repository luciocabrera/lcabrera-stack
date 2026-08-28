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
        <LockedFiltersList />
        <ActiveFiltersList isBusy={isBusy} />
        <FiltersSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
