import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { ColumnsOrderIcon, RefreshIcon } from '@/components/Icons';

import type { ColumnOrderSectionFooterProps } from './ColumnOrderSectionFooter.types';

import {
  useOrderColumnsBySorting,
  useResetColumnOrderAndVisibility,
} from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './ColumnOrderSectionFooter.stylex';

export const ColumnOrderSectionFooter = ({
  variant = 'footer',
}: ColumnOrderSectionFooterProps) => {
  const sorting = useGetColumnsSorting();

  const orderColumnsBySorting = useOrderColumnsBySorting();
  const resetColumnOrderAndVisibility = useResetColumnOrderAndVisibility();

  const hasSorting = sorting.length > 0;

  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? 14 : 16;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label='Order by Sorting'
        color={buttonColor}
        icon={<ColumnsOrderIcon size={iconSize} />}
        isDisabled={!hasSorting}
        onClick={orderColumnsBySorting}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Order by Sorting'}
      </Button>
      <Button
        aria-label='Reset Order & Visibility'
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnOrderAndVisibility}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Reset Order & Visibility'}
      </Button>
    </div>
  );
};
