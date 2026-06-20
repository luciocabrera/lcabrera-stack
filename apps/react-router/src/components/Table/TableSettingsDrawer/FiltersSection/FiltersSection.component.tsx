import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@/components/SidePanel';
import { useSetTableSettingsExpandedFilters } from '@/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '@/components/Table/contexts/TableConfig/meta/selectors';

import type { FiltersSectionProps } from './FiltersSection.types';

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

export const FiltersSection = ({ isBusy = false }: FiltersSectionProps) => {
  const filters = useGetColumnFilters();
  const onFiltersChange = useSetColumnFilters();
  const persistedExpandedFilters = useGetTableSettingsExpandedFilters();
  const setTableSettingsExpandedFilters = useSetTableSettingsExpandedFilters();

  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    () => new Set(persistedExpandedFilters),
  );
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

  const handleExpandedFiltersChange = (nextExpandedFilters: Set<string>) => {
    setExpandedFilters(nextExpandedFilters);
    setTableSettingsExpandedFilters(Array.from(nextExpandedFilters));
  };

  const handleClearLocalState = () => {
    onFiltersChange({});
    handleExpandedFiltersChange(new Set());
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
    handleExpandedFiltersChange(new Set());
  };

  const handleExpandAll = () => {
    handleExpandedFiltersChange(new Set(filterKeys));
  };

  return (
    <SidePanelSectionMain>
      <AddFilterSection
        expandedFilters={expandedFilters}
        isBusy={isBusy}
        onDropdownOpenChange={setIsAddFilterOpen}
        onExpandedFiltersChange={handleExpandedFiltersChange}
      />
      <SidePanelSectionOverlay isOpen={isAddFilterOpen}>
        <ActiveFiltersList
          expandedFilters={expandedFilters}
          isBusy={isBusy}
          isCollapseAllDisabled={!hasExpandedFilters}
          isExpandAllDisabled={!hasFilters || areAllFiltersExpanded}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
          onExpandedFiltersChange={handleExpandedFiltersChange}
        />
        <FiltersSectionToolbar
          isBusy={isBusy}
          isCollapseAllDisabled={!hasExpandedFilters}
          isExpandAllDisabled={!hasFilters || areAllFiltersExpanded}
          onClearAll={handleClearLocalState}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
        />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
