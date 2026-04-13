import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@/components/SidePanel';

import { useSetColumnFilters } from '../TableDrawerContext/actions/index.ts';
import { ActiveFiltersList } from './ActiveFiltersList/index.ts';
import { AddFilterSection } from './AddFilterSection/index.ts';
import { FiltersSectionToolbar } from './FiltersSectionToolbar/index.ts';

/**
 * Orchestrator component for the filters section.
 * Manages only the shared expandedFilters state.
 * Child components subscribe to context data directly.
 */

export const FiltersSection = () => {
  const onFiltersChange = useSetColumnFilters();

  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

  const handleClearLocalState = () => {
    onFiltersChange({});
    setExpandedFilters(new Set());
  };

  return (
    <SidePanelSectionMain>
      <AddFilterSection
        expandedFilters={expandedFilters}
        onDropdownOpenChange={setIsAddFilterOpen}
        onExpandedFiltersChange={setExpandedFilters}
      />
      <SidePanelSectionOverlay isOpen={isAddFilterOpen}>
        <ActiveFiltersList
          expandedFilters={expandedFilters}
          onExpandedFiltersChange={setExpandedFilters}
        />
        <FiltersSectionToolbar onClearAll={handleClearLocalState} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
