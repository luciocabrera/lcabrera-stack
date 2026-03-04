import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { ColumnsOrderIcon, RefreshIcon } from '@/components/Icons';

import {
  useOrderColumnsBySorting,
  useResetColumnOrderAndVisibility,
} from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './ColumnOrderSectionFooter.stylex';

export const ColumnOrderSectionFooter = () => {
  const sorting = useGetColumnsSorting();

  const orderColumnsBySorting = useOrderColumnsBySorting();
  const resetColumnOrderAndVisibility = useResetColumnOrderAndVisibility();

  const hasSorting = sorting.length > 0;

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color='outline'
        icon={<ColumnsOrderIcon size={16} />}
        isDisabled={!hasSorting}
        onClick={orderColumnsBySorting}
        size='sm'
        width='full'
      >
        Order by Sorting
      </Button>
      <Button
        color='outline'
        icon={<RefreshIcon size={16} />}
        onClick={resetColumnOrderAndVisibility}
        size='sm'
        width='full'
      >
        Reset Order & Visibility
      </Button>
    </div>
  );
};
