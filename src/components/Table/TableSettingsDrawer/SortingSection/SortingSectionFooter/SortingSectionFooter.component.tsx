import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, ListOrderedIcon, RefreshIcon } from '@/components/Icons';

import {
  useClearSorting,
  useResetSorting,
  useSortByColumnOrder,
} from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './SortingSectionFooter.stylex';

export const SortingSectionFooter = () => {
  const sorting = useGetColumnsSorting();

  const sortByColumnOrder = useSortByColumnOrder();
  const clearSorting = useClearSorting();
  const resetSorting = useResetSorting();

  const hasSorting = sorting.length > 0;

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color='outline'
        icon={<ListOrderedIcon size={16} />}
        onClick={sortByColumnOrder}
        size='sm'
        width='full'
      >
        Sort by Column Order
      </Button>
      <Button
        color='outline'
        icon={<EraserIcon size={16} />}
        isDisabled={!hasSorting}
        onClick={clearSorting}
        size='sm'
        width='full'
      >
        Clear Sorting
      </Button>
      <Button
        color='outline'
        icon={<RefreshIcon size={16} />}
        onClick={resetSorting}
        size='sm'
        width='full'
      >
        Reset Sorting
      </Button>
    </div>
  );
};
