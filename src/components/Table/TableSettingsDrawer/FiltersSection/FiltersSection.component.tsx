import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { useSetColumnFilters } from '../TableDrawerContext/hooks/store/columns/actions';
import { useGetColumnFilters } from '../TableDrawerContext/hooks/store/columns/selectors';
import { ActiveFiltersList } from './ActiveFiltersList';
import { AddFilterSection } from './AddFilterSection';
import { styles } from './FiltersSection.stylex';
import { ResetFiltersSection } from './ResetFiltersSection';

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

  const hasFilters = Object.keys(filters).length > 0;

  const handleClearAll = () => {
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
      <ResetFiltersSection
        isDisabled={!hasFilters}
        onClearAll={handleClearAll}
      />
    </div>
  );
};
