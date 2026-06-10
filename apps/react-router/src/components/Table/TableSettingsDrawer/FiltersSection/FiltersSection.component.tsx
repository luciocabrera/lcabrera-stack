import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@/components/SidePanel';

import { useSetColumnFilters } from '../TableDrawerContext/actions';
import { useGetColumnFilters } from '../TableDrawerContext/selectors';
import { ActiveFiltersList } from './ActiveFiltersList';
import { AddFilterSection } from './AddFilterSection';
import { FiltersSectionToolbar } from './FiltersSectionToolbar';

/**
 * Orchestrator component for the filters section.
 * Manages only the shared expandedFilters state.
 * Child components subscribe to context data directly.
 */

export const FiltersSection = () => {
  const filters = useGetColumnFilters();
  const onFiltersChange = useSetColumnFilters();

  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

  const handleClearLocalState = () => {
    onFiltersChange({});
    setExpandedFilters(new Set());
  };

  const filterKeys = Object.keys(filters);
  const hasFilters = filterKeys.length > 0;
  const hasExpandedFilters = expandedFilters.size > 0;
  const areAllFiltersExpanded =
    hasFilters &&
    filterKeys.every((filterKey) => {
      return expandedFilters.has(filterKey);
    });

  const handleCollapseAll = () => {
    setExpandedFilters(new Set());
  };

  const handleExpandAll = () => {
    setExpandedFilters(new Set(filterKeys));
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
          isCollapseAllDisabled={!hasExpandedFilters}
          isExpandAllDisabled={!hasFilters || areAllFiltersExpanded}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
          onExpandedFiltersChange={setExpandedFilters}
        />
        <FiltersSectionToolbar
          isCollapseAllDisabled={!hasExpandedFilters}
          isExpandAllDisabled={!hasFilters || areAllFiltersExpanded}
          onCollapseAll={handleCollapseAll}
          onClearAll={handleClearLocalState}
          onExpandAll={handleExpandAll}
        />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
