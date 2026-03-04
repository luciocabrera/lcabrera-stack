import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

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

  const handleClearLocalState = () => {
    onFiltersChange({});
    setExpandedFilters(new Set());
  };

  return (
    <div {...stylex.props(styles.container)}>
      <AddFilterSection
        expandedFilters={expandedFilters}
        onExpandedFiltersChange={setExpandedFilters}
      />
      <ActiveFiltersList
        expandedFilters={expandedFilters}
        onExpandedFiltersChange={setExpandedFilters}
      />
      <FiltersSectionFooter onClearAll={handleClearLocalState} />
    </div>
  );
};
