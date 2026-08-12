import { CLEAR_GROUPING_COMMAND } from '#ui/components/Table/commands';
import { useClearTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';

/**
 * The grouping section's toolbar, in both the header (compact) and footer
 * (labelled) variants the drawer-section pattern defines.
 *
 * It carries the clear command and no reset: grouping has no cookie-persisted
 * default to reset *to*. It is URL state (ADR-061), so "reset" and "clear" would
 * be the same action under two names, and sorting's three-button toolbar is
 * therefore not the shape to copy wholesale.
 *
 * The command descriptor is the one the header menu uses, so the two surfaces
 * cannot come to label the same action differently.
 */
export const GroupingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetTableGroupingKeys();
  const clearGrouping = useClearTableGrouping();

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
