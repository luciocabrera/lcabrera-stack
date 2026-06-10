import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { FiltersSectionToolbarProps } from './FiltersSectionToolbar.types';

import {
  useClearFilters,
  useResetFilters,
} from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { styles } from './FiltersSectionToolbar.stylex';

const FILTERS_TOOLBAR = {
  clear: { label: 'Clear Filters' },
  reset: { label: 'Reset Filters' },
} as const;

export const FiltersSectionToolbar = ({
  onClearAll,
  variant = 'footer',
}: FiltersSectionToolbarProps) => {
  const filters = useGetColumnFilters();

  const clearFilters = useClearFilters();
  const resetFilters = useResetFilters();

  const hasFilters = Object.keys(filters).length > 0;
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  const handleClear = () => {
    clearFilters();
    onClearAll?.();
  };

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label={FILTERS_TOOLBAR.clear.label}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasFilters}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? FILTERS_TOOLBAR.clear.label : undefined}
      >
        {!isToolbar && FILTERS_TOOLBAR.clear.label}
      </Button>
      <Button
        aria-label={FILTERS_TOOLBAR.reset.label}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetFilters}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? FILTERS_TOOLBAR.reset.label : undefined}
      >
        {!isToolbar && FILTERS_TOOLBAR.reset.label}
      </Button>
    </div>
  );
};

FiltersSectionToolbar.displayName = 'FiltersSectionToolbar';
