import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@repo/ui/components/SidePanel';
import { useState } from 'react';

import type { FiltersSectionProps } from './FiltersSection.types';

import { ActiveFiltersList } from './ActiveFiltersList';
import { AddFilterSection } from './AddFilterSection';
import { FiltersSectionToolbar } from './FiltersSectionToolbar';

/**
 * Filters drawer section; a thin shell composing self-connected delegates:
 * AddFilterSection (column picker + add), ActiveFiltersList (expandable
 * filter rows), and the footer FiltersSectionToolbar. Expanded-filter state
 * is owned by the table meta store (persisted); the shell holds only the
 * add-filter dropdown overlay flag (UI-local presentation state).
 */
export const FiltersSection = ({ isBusy = false }: FiltersSectionProps) => {
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

  return (
    <SidePanelSectionMain>
      <AddFilterSection
        isBusy={isBusy}
        onDropdownOpenChange={setIsAddFilterOpen}
      />
      <SidePanelSectionOverlay isOpen={isAddFilterOpen}>
        <ActiveFiltersList isBusy={isBusy} />
        <FiltersSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
