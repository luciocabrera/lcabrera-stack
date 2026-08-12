import { EraserIcon, ListOrderedIcon, RefreshIcon } from '#ui/components/Icons';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import {
  useClearSorting,
  useResetSorting,
  useSortByColumnOrder,
} from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';

const SORTING_SECTION_TOOLBAR = {
  clear: { label: 'Clear Sorting' },
  orderByColumnOrder: { label: 'Sort by Column Order' },
  reset: { label: 'Reset Sorting' },
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

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: ListOrderedIcon,
      key: SORTING_SECTION_TOOLBAR.orderByColumnOrder.label,
      label: SORTING_SECTION_TOOLBAR.orderByColumnOrder.label,
      onClick: sortByColumnOrder,
    },
    {
      icon: EraserIcon,
      isDisabled: !hasSorting,
      key: SORTING_SECTION_TOOLBAR.clear.label,
      label: SORTING_SECTION_TOOLBAR.clear.label,
      onClick: clearSorting,
    },
    {
      icon: RefreshIcon,
      key: SORTING_SECTION_TOOLBAR.reset.label,
      label: SORTING_SECTION_TOOLBAR.reset.label,
      onClick: resetSorting,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
