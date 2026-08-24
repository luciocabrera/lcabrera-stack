import { CLEAR_GROUPING_COMMAND } from '#ui/components/Table/commands';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import { useClearGrouping } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';

/**
 * The grouping section's toolbar, in both the header (compact) and footer (labelled)
 * variants the drawer-section pattern defines.
 * It carries the clear command and no reset: grouping has no cookie-persisted default to
 * reset *to*.
 */
export const GroupingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetGroupingKeys();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const clearGrouping = useClearGrouping();

  // Clearing is the largest edit of all, so the lock reaches it first (#578).
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
