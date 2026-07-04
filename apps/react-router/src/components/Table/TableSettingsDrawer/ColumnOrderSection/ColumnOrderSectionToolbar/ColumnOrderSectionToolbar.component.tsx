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

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { ColumnOrderSectionToolbarProps } from './ColumnOrderSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import { useOrderBySorting } from '../ColumnOrderSectionContext/actions';

const COLUMN_ORDER_TOOLBAR = {
  clear: { label: 'Clear Visibility & Pinning' },
  orderBySorting: { label: 'Order by Sorting' },
  reset: { label: 'Reset Order & Visibility' },
} as const;

export const ColumnOrderSectionToolbar = ({
  isBusy = false,
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

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: ColumnsOrderIcon,
      isDisabled: !hasSorting,
      key: COLUMN_ORDER_TOOLBAR.orderBySorting.label,
      label: COLUMN_ORDER_TOOLBAR.orderBySorting.label,
      onClick: orderBySorting,
    },
    {
      icon: EraserIcon,
      isDisabled: !hasClearableState,
      key: COLUMN_ORDER_TOOLBAR.clear.label,
      label: COLUMN_ORDER_TOOLBAR.clear.label,
      onClick: clearColumnOrderSection,
    },
    {
      icon: RefreshIcon,
      key: COLUMN_ORDER_TOOLBAR.reset.label,
      label: COLUMN_ORDER_TOOLBAR.reset.label,
      onClick: resetColumnOrderAndVisibility,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
