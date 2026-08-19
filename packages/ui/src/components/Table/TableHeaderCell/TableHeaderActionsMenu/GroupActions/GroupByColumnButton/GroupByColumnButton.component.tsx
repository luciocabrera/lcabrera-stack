import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  GROUP_BY_COLUMN_COMMAND,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useToggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  MAX_TABLE_GROUP_KEYS,
  TABLE_GROUP_KEY_REFUSAL_LABELS,
} from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import type { GroupByColumnButtonProps } from './GroupByColumnButton.types';

/**
 * "Group by This" item of the grouping section: adds this column to the group
 * keys and highlights itself while it is one of them, clicking again to remove
 * it. A self-connected delegate — it reads the applied keys from the grouping
 * store itself rather than being handed them, so no parent drills grouping
 * state through the menu.
 *
 * `current` is **this column when it is a key**, not the first key, and that is
 * what makes `deriveToggleCommandState` say the right thing under multi-key
 * grouping: "active" means the table is grouped by this column, whatever else
 * it is also grouped by. Reading `keys[0]` would light up only the outermost
 * level and leave every deeper one looking unapplied.
 *
 * **The catalogue's answer narrows the declared one** (ADR-058, #642). The
 * endpoint decides group-key legality from the column's real Postgres type and
 * its distinct-value statistics, and refuses a large share of the columns a
 * table declares `isGroupable` — so an item built from the declaration alone
 * offers keys the query then rejects. A refused column is disabled here and
 * says why in its `title`, which is the difference between an affordance a user
 * can rule out before clicking and one that empties the table. `title` and
 * `isDisabled` are gated on the **same** condition, so the explanation can never
 * appear on a control that is about to do something else.
 *
 * Disabling is never applied to a key that is **already applied**, at the depth
 * cap or under a refusal: a click on an applied key removes it, and a URL can
 * seed a grouping the catalogue would refuse today (ADR-061), so making that
 * item unclickable would be the one state a user could not leave from here.
 * Refusing past the cap is `resolveTableGroupingUpdate`'s job and happens
 * whatever this button says; disabling is so a user is not offered an action
 * that would be ignored.
 */
export const GroupByColumnButton = <TData,>({
  columnKey,
  onClose,
}: GroupByColumnButtonProps<TData>) => {
  const toggleGroupKey = useToggleTableGroupKey();
  const groupingKeys = useGetTableGroupingKeys();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const capability = useGetTableColumnGroupingCapability(String(columnKey));
  const { isGroupable, refusal, requiredPeriod } =
    resolveGroupKeyAvailability<TData>({ capability, column });
  const { icon: GroupByColumnCommandIcon, label } = GROUP_BY_COLUMN_COMMAND;

  const isApplied = groupingKeys.includes(String(columnKey));
  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: isApplied ? String(columnKey) : undefined,
    isDisabled: !isApplied && (!isGroupable || isAtDepthCap),
    target: String(columnKey),
  });

  const handleGroupByColumn = () => {
    // The granularity goes on with the key: a column the catalogue refuses raw
    // is offered only truncated, so adding it without one applies a grouping
    // the server would refuse (ADR-084).
    toggleGroupKey({ columnKey: String(columnKey), period: requiredPeriod });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <GroupByColumnCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleGroupByColumn}
      orientation='horizontal'
      size='mini'
      // The reason rides the disabled item rather than a tooltip: a disabled
      // button fires no pointer events, so a tooltip on one never opens.
      //
      // Gated on `!isEnabled` and not merely on the refusal: an applied key is
      // still clickable under one, and there the click **removes** the
      // grouping. "Cannot group by this column" on a control about to ungroup
      // would describe an action the user is not taking.
      {...(refusal !== undefined &&
        !isEnabled && {
          title: `Cannot group by this column: ${TABLE_GROUP_KEY_REFUSAL_LABELS[refusal]}.`,
        })}
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
