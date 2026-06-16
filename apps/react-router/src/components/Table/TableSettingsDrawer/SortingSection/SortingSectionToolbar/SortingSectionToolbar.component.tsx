import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, ListOrderedIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types';

import {
  useClearSorting,
  useResetSorting,
  useSortByColumnOrder,
} from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './SortingSectionToolbar.stylex';

const SORTING_SECTION_TOOLBAR = {
  clear: { label: 'Clear Sorting' },
  reset: { label: 'Reset Sorting' },
  orderByColumnOrder: { label: 'Sort by Column Order' },
} as const;

export const SortingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: SortingSectionToolbarProps) => {
  const sorting = useGetColumnsSorting();

  const sortByColumnOrder = useSortByColumnOrder();
  const clearSorting = useClearSorting();
  const resetSorting = useResetSorting();

  const hasSorting = sorting.length > 0;

  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label={SORTING_SECTION_TOOLBAR.orderByColumnOrder.label}
        color={buttonColor}
        icon={<ListOrderedIcon size={iconSize} />}
        isBusy={isBusy}
        onClick={sortByColumnOrder}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar
            ? SORTING_SECTION_TOOLBAR.orderByColumnOrder.label
            : undefined
        }
      >
        {!isToolbar && SORTING_SECTION_TOOLBAR.orderByColumnOrder.label}
      </Button>
      <Button
        aria-label={SORTING_SECTION_TOOLBAR.clear.label}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isBusy={isBusy}
        isDisabled={!hasSorting}
        onClick={clearSorting}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar ? SORTING_SECTION_TOOLBAR.clear.label : undefined
        }
      >
        {!isToolbar && SORTING_SECTION_TOOLBAR.clear.label}
      </Button>
      <Button
        aria-label={SORTING_SECTION_TOOLBAR.reset.label}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        isBusy={isBusy}
        onClick={resetSorting}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar ? SORTING_SECTION_TOOLBAR.reset.label : undefined
        }
      >
        {!isToolbar && SORTING_SECTION_TOOLBAR.reset.label}
      </Button>
    </div>
  );
};
