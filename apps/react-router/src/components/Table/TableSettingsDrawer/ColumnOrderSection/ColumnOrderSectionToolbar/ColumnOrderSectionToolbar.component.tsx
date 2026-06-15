import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { ColumnsOrderIcon, EraserIcon, RefreshIcon } from '@/components/Icons';
import {
  useClearColumnOrderSection,
  useResetColumnOrderAndVisibility,
} from '@/components/Table/TableSettingsDrawer/TableDrawerContext/actions';
import {
  useGetColumnPinning,
  useGetColumnsSorting,
  useGetColumnVisibility,
} from '@/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { ColumnOrderSectionToolbarProps } from './ColumnOrderSectionToolbar.types';

import { useOrderBySorting } from '../ColumnOrderSectionContext/actions';
import { styles } from './ColumnOrderSectionToolbar.stylex';

const COLUMN_ORDER_TOOLBAR = {
  clear: { label: 'Clear Visibility & Pinning' },
  reset: { label: 'Reset Order & Visibility' },
  orderBySorting: { label: 'Order by Sorting' },
} as const;

export const ColumnOrderSectionToolbar = ({
  isBussy = false,
  variant = 'footer',
}: ColumnOrderSectionToolbarProps) => {
  const sorting = useGetColumnsSorting();
  const pinning = useGetColumnPinning();
  const visibility = useGetColumnVisibility();

  const orderBySorting = useOrderBySorting();
  const clearColumnOrderSection = useClearColumnOrderSection();
  const resetColumnOrderAndVisibility = useResetColumnOrderAndVisibility();

  const hasSorting = sorting.length > 0;
  const hasPinning = pinning.left.length > 0 || pinning.right.length > 0;
  const hasHiddenColumns = visibility instanceof Set && visibility.size > 0;
  const hasClearableState = hasPinning || hasHiddenColumns;

  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label={COLUMN_ORDER_TOOLBAR.orderBySorting.label}
        color={buttonColor}
        icon={<ColumnsOrderIcon size={iconSize} />}
        isBussy={isBussy}
        isDisabled={!hasSorting}
        onClick={orderBySorting}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar ? COLUMN_ORDER_TOOLBAR.orderBySorting.label : undefined
        }
      >
        {!isToolbar && COLUMN_ORDER_TOOLBAR.orderBySorting.label}
      </Button>
      <Button
        aria-label={COLUMN_ORDER_TOOLBAR.clear.label}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isBussy={isBussy}
        isDisabled={!hasClearableState}
        onClick={clearColumnOrderSection}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar ? COLUMN_ORDER_TOOLBAR.clear.label : undefined
        }
      >
        {!isToolbar && COLUMN_ORDER_TOOLBAR.clear.label}
      </Button>
      <Button
        aria-label={COLUMN_ORDER_TOOLBAR.reset.label}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        isBussy={isBussy}
        onClick={resetColumnOrderAndVisibility}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={
          isToolbar ? COLUMN_ORDER_TOOLBAR.reset.label : undefined
        }
      >
        {!isToolbar && COLUMN_ORDER_TOOLBAR.reset.label}
      </Button>
    </div>
  );
};
