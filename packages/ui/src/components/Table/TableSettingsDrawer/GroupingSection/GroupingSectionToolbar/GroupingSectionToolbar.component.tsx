import { CLEAR_GROUPING_COMMAND } from '#ui/components/Table/commands';

import type { SectionToolbarButton } from '../../SectionToolbar';
import type { GroupingSectionToolbarProps } from './GroupingSectionToolbar.types';

import { SectionToolbar } from '../../SectionToolbar';
import { useClearGrouping } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';

/**
 * The grouping section's toolbar, in both the header (compact) and footer
 * (labelled) variants the drawer-section pattern defines. One component serves
 * both placements, so Clear stages the change on either of them.
 *
 * It carries the clear command and no reset: grouping has no cookie-persisted
 * default to reset *to*. It is URL state (ADR-061), so "reset" and "clear" would
 * be the same action under two names, and sorting's three-button toolbar is
 * therefore not the shape to copy wholesale.
 *
 * The command descriptor is the one the header menu uses, so the two surfaces
 * cannot come to label the same action differently — but the actions differ on
 * purpose: the header menu applies immediately, this one stages for Accept.
 */
export const GroupingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: GroupingSectionToolbarProps) => {
  const groupingKeys = useGetGroupingKeys();
  const clearGrouping = useClearGrouping();

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
