import { EraserIcon, RefreshIcon } from '#ui/components/Icons';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import {
  useClearGrouping,
  useResetGrouping,
} from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';

const GROUPING_TOOLBAR = {
  clear: { label: 'Clear Grouping' },
  reset: { label: 'Reset Grouping' },
} as const;

export const GroupingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetGroupingKeys();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const clearGrouping = useClearGrouping();
  const resetGrouping = useResetGrouping();

  // Clearing is the largest edit of all, so the lock reaches it first (#578).
  if (isGroupingLocked) return;

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: EraserIcon,
      isDisabled: groupingKeys.length === 0,
      key: GROUPING_TOOLBAR.clear.label,
      label: GROUPING_TOOLBAR.clear.label,
      onClick: clearGrouping,
    },
    {
      icon: RefreshIcon,
      key: GROUPING_TOOLBAR.reset.label,
      label: GROUPING_TOOLBAR.reset.label,
      onClick: resetGrouping,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
