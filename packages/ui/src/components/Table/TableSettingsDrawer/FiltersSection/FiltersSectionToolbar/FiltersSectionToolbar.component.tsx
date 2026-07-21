import {
  CollapseAllIcon,
  EraserIcon,
  ExpandAllIcon,
  RefreshIcon,
} from '@lcabrera/ui/components/Icons';
import { useSetTableSettingsExpandedFilters } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { FiltersSectionToolbarProps } from './FiltersSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import {
  useClearFilters,
  useResetFilters,
} from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { areAllFiltersExpanded } from '../utils/areAllFiltersExpanded.util';

const FILTERS_TOOLBAR = {
  clear: { label: 'Clear Filters' },
  collapseAll: { label: 'Collapse All Filters' },
  expandAll: { label: 'Expand All Filters' },
  reset: { label: 'Reset Filters' },
} as const;

/**
 * Clear/reset/expand-all/collapse-all buttons for the filters section, in
 * header ('toolbar') and footer variants. Fully self-connected: reads the
 * filter store and the persisted expanded-filters state and dispatches all
 * four actions itself.
 */
export const FiltersSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: FiltersSectionToolbarProps) => {
  const filters = useGetColumnFilters();
  const expandedFilters = useGetTableSettingsExpandedFilters();

  const clearFilters = useClearFilters();
  const resetFilters = useResetFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();

  const filterKeys = Object.keys(filters);
  const hasFilters = filterKeys.length > 0;
  const hasExpandedFilters = expandedFilters.length > 0;
  const isExpandAllDisabled =
    !hasFilters || areAllFiltersExpanded({ expandedFilters, filterKeys });

  const handleClear = () => {
    clearFilters();
    setExpandedFilters([]);
  };

  const handleExpandAll = () => {
    setExpandedFilters(filterKeys);
  };

  const handleCollapseAll = () => {
    setExpandedFilters([]);
  };

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: EraserIcon,
      isDisabled: !hasFilters,
      key: FILTERS_TOOLBAR.clear.label,
      label: FILTERS_TOOLBAR.clear.label,
      onClick: handleClear,
    },
    {
      icon: RefreshIcon,
      key: FILTERS_TOOLBAR.reset.label,
      label: FILTERS_TOOLBAR.reset.label,
      onClick: resetFilters,
    },
    {
      icon: ExpandAllIcon,
      isDisabled: isExpandAllDisabled,
      key: FILTERS_TOOLBAR.expandAll.label,
      label: FILTERS_TOOLBAR.expandAll.label,
      onClick: handleExpandAll,
    },
    {
      icon: CollapseAllIcon,
      isDisabled: !hasExpandedFilters,
      key: FILTERS_TOOLBAR.collapseAll.label,
      label: FILTERS_TOOLBAR.collapseAll.label,
      onClick: handleCollapseAll,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
