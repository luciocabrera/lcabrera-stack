import {
  CollapseAllIcon,
  EraserIcon,
  ExpandAllIcon,
  RefreshIcon,
} from '@/components/Icons';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { FiltersSectionToolbarProps } from './FiltersSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import {
  useClearFilters,
  useResetFilters,
} from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';

const FILTERS_TOOLBAR = {
  clear: { label: 'Clear Filters' },
  collapseAll: { label: 'Collapse All Filters' },
  expandAll: { label: 'Expand All Filters' },
  reset: { label: 'Reset Filters' },
} as const;

export const FiltersSectionToolbar = ({
  isBusy = false,
  isCollapseAllDisabled = false,
  isExpandAllDisabled = false,
  onClearAll,
  onCollapseAll,
  onExpandAll,
  variant = 'footer',
}: FiltersSectionToolbarProps) => {
  const filters = useGetColumnFilters();

  const clearFilters = useClearFilters();
  const resetFilters = useResetFilters();

  const hasFilters = Object.keys(filters).length > 0;

  const handleClear = () => {
    clearFilters();
    onClearAll?.();
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
      isDisabled: isExpandAllDisabled || !onExpandAll,
      key: FILTERS_TOOLBAR.expandAll.label,
      label: FILTERS_TOOLBAR.expandAll.label,
      onClick: onExpandAll,
    },
    {
      icon: CollapseAllIcon,
      isDisabled: isCollapseAllDisabled || !onCollapseAll,
      key: FILTERS_TOOLBAR.collapseAll.label,
      label: FILTERS_TOOLBAR.collapseAll.label,
      onClick: onCollapseAll,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
