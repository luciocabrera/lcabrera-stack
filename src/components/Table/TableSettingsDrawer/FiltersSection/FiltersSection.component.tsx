import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { SidePanelSectionMain } from '@/components/SidePanel';

import { useSetColumnFilters } from '../TableDrawerContext/actions';
import { ActiveFiltersList } from './ActiveFiltersList';
import { AddFilterSection } from './AddFilterSection';
import { styles } from './FiltersSection.stylex';
import { FiltersSectionFooter } from './FiltersSectionFooter';

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
      <div {...stylex.props(styles.restArea)}>
        {isAddFilterOpen && <div {...stylex.props(styles.overlay)} />}
        <ActiveFiltersList
          expandedFilters={expandedFilters}
          onExpandedFiltersChange={setExpandedFilters}
        />
        <FiltersSectionFooter onClearAll={handleClearLocalState} />
      </div>
    </SidePanelSectionMain>
  );
};
