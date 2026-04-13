import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, ListOrderedIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types.ts';

import {
  useClearSorting,
  useResetSorting,
  useSortByColumnOrder,
} from '../../TableDrawerContext/actions/index.ts';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors/index.ts';
import { styles } from './SortingSectionToolbar.stylex.ts';

export const SortingSectionToolbar = ({
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
        aria-label='Sort by Column Order'
        color={buttonColor}
        icon={<ListOrderedIcon size={iconSize} />}
        onClick={sortByColumnOrder}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Sort by Column Order'}
      </Button>
      <Button
        aria-label='Clear Sorting'
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasSorting}
        onClick={clearSorting}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Clear Sorting'}
      </Button>
      <Button
        aria-label='Reset Sorting'
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetSorting}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Reset Sorting'}
      </Button>
    </div>
  );
};
