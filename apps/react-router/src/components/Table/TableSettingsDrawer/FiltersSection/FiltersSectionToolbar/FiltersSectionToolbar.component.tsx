import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import {
  CollapseAllIcon,
  EraserIcon,
  ExpandAllIcon,
  RefreshIcon,
} from '@/components/Icons';

import type {
  FiltersSectionToolbarProps,
  FiltersToolbarButton,
} from './FiltersSectionToolbar.types';

import {
  useClearFilters,
  useResetFilters,
} from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { styles } from './FiltersSectionToolbar.stylex';
import { resolveFiltersToolbarPresentation } from './utils/resolveFiltersToolbarPresentation.util';

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

  const { buttonColor, buttonSize, buttonWidth, iconSize, isToolbar } =
    resolveFiltersToolbarPresentation(variant);
  const hasFilters = Object.keys(filters).length > 0;

  const handleClear = () => {
    clearFilters();
    onClearAll?.();
  };

  const buttons: readonly FiltersToolbarButton[] = [
    {
      icon: <EraserIcon size={iconSize} />,
      isDisabled: !hasFilters,
      key: FILTERS_TOOLBAR.clear.label,
      label: FILTERS_TOOLBAR.clear.label,
      onClick: handleClear,
    },
    {
      icon: <RefreshIcon size={iconSize} />,
      key: FILTERS_TOOLBAR.reset.label,
      label: FILTERS_TOOLBAR.reset.label,
      onClick: resetFilters,
    },
    {
      icon: <ExpandAllIcon size={iconSize} />,
      isDisabled: isExpandAllDisabled || !onExpandAll,
      key: FILTERS_TOOLBAR.expandAll.label,
      label: FILTERS_TOOLBAR.expandAll.label,
      onClick: onExpandAll,
    },
    {
      icon: <CollapseAllIcon size={iconSize} />,
      isDisabled: isCollapseAllDisabled || !onCollapseAll,
      key: FILTERS_TOOLBAR.collapseAll.label,
      label: FILTERS_TOOLBAR.collapseAll.label,
      onClick: onCollapseAll,
    },
  ];

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      {buttons.map((button) => (
        <Button
          aria-label={button.label}
          color={buttonColor}
          icon={button.icon}
          isBusy={isBusy}
          isDisabled={button.isDisabled}
          key={button.key}
          onClick={button.onClick}
          size={buttonSize}
          tooltipContent={isToolbar ? button.label : undefined}
          width={buttonWidth}
        >
          {!isToolbar && button.label}
        </Button>
      ))}
    </div>
  );
};
