import { EraserIcon, RefreshIcon } from '#ui/components/Icons';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import {
  useClearColumnAggregates,
  useClearGrouping,
  useClearGroupKeys,
  useResetColumnAggregates,
  useResetGrouping,
  useResetGroupKeys,
} from '../../TableDrawerContext/actions';
import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '../../TableDrawerContext/selectors';

const GROUPING_TOOLBAR_LABELS = {
  aggregates: { clear: 'Clear Aggregates', reset: 'Reset Aggregates' },
  grouping: { clear: 'Clear Grouping', reset: 'Reset Grouping' },
  keys: { clear: 'Clear Group Keys', reset: 'Reset Group Keys' },
} as const;

export const GroupingSectionToolbar = ({
  isBusy = false,
  scope = 'grouping',
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetGroupingKeys();
  const aggregates = useGetGroupingAggregates();
  const isGroupingLocked = useGetTableIsGroupingLocked();

  const clearGrouping = useClearGrouping();
  const resetGrouping = useResetGrouping();
  const clearGroupKeys = useClearGroupKeys();
  const resetGroupKeys = useResetGroupKeys();
  const clearColumnAggregates = useClearColumnAggregates();
  const resetColumnAggregates = useResetColumnAggregates();

  if (isGroupingLocked) return;

  const scoped = {
    aggregates: {
      clear: clearColumnAggregates,
      isEmpty: aggregates.length === 0,
      reset: resetColumnAggregates,
    },
    grouping: {
      clear: clearGrouping,
      isEmpty: groupingKeys.length === 0 && aggregates.length === 0,
      reset: resetGrouping,
    },
    keys: {
      clear: clearGroupKeys,
      isEmpty: groupingKeys.length === 0,
      reset: resetGroupKeys,
    },
  }[scope];

  const labels = GROUPING_TOOLBAR_LABELS[scope];

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: EraserIcon,
      isDisabled: scoped.isEmpty,
      key: labels.clear,
      label: labels.clear,
      onClick: scoped.clear,
    },
    {
      icon: RefreshIcon,
      key: labels.reset,
      label: labels.reset,
      onClick: scoped.reset,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
