import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types';

import {
  useResetColumnSorting,
  useSetColumnSorting,
} from '../../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../../ColumnDrawerContext/selectors';
import { styles } from './SortingSectionToolbar.stylex';

const SORTING_TOOLBAR = {
  clear: { label: 'Clear Sorting' },
  reset: { label: 'Reset Sorting' },
} as const;

export const SortingSectionToolbar = ({
  variant = 'footer',
}: SortingSectionToolbarProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();
  const resetColumnSorting = useResetColumnSorting();

  const hasSorting = sortDirection !== undefined;
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  const handleClear = () => {
    setColumnSorting(undefined);
  };

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label={SORTING_TOOLBAR.clear.label}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasSorting}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? SORTING_TOOLBAR.clear.label : undefined}
      >
        {!isToolbar && SORTING_TOOLBAR.clear.label}
      </Button>
      <Button
        aria-label={SORTING_TOOLBAR.reset.label}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnSorting}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? SORTING_TOOLBAR.reset.label : undefined}
      >
        {!isToolbar && SORTING_TOOLBAR.reset.label}
      </Button>
    </div>
  );
};
