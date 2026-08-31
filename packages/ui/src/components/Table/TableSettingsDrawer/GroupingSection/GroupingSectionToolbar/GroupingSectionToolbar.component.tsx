import { CLEAR_GROUPING_COMMAND } from '#ui/components/Table/commands';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import { useClearGrouping } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';

export const GroupingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetGroupingKeys();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const clearGrouping = useClearGrouping();

  if (isGroupingLocked) return;

  const buttons: readonly SectionToolbarButton[] = [
    {
      icon: CLEAR_GROUPING_COMMAND.icon,
      isDisabled: groupingKeys.length === 0,
      key: CLEAR_GROUPING_COMMAND.label,
      label: CLEAR_GROUPING_COMMAND.label,
      onClick: clearGrouping,
    },
  ];

  return <SectionToolbar buttons={buttons} isBusy={isBusy} variant={variant} />;
};
