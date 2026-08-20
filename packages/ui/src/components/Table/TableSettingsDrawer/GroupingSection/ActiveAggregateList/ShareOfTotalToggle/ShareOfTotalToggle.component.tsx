import { Button } from '#ui/components/Button';
import { BarChartIcon } from '#ui/components/Icons';
import { isShareableAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL } from '#ui/components/Table/Table.constants';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { ShareOfTotalToggleProps } from './ShareOfTotalToggle.types';

import { useToggleGroupShare } from '../../../TableDrawerContext/actions';
import { useGetGroupingShares } from '../../../TableDrawerContext/selectors';

/**
 * Turns one aggregate's share of the grand total on or off.
 *
 * **It renders nothing where a share is not defined**, which is every aggregate
 * but `sum` and `count`. That is the same shape `GroupKeyPeriodSelect` takes on
 * a non-temporal key, and for the same reason: an inert control on a measure
 * that can never carry the thing it offers reads as a bug.
 *
 * It asks about its own `fn` rather than looking the column's aggregate up
 * (#831): a column may carry both `sum` and `count`, so there is no single "the
 * column's aggregate" left to read, and each row here owns exactly one measure.
 * The `fn` is identity, forwarded by the row that renders it; the pressed state
 * still comes from the store.
 *
 * The label names the denominator rather than the operation — "share of grand
 * total", not "show percentage" — because which total is being divided by is
 * the decision a reader has to be able to make out (ADR-086), and this control
 * is where it is chosen.
 */
export const ShareOfTotalToggle = ({
  columnKey,
  fn,
  isBusy = false,
  label,
}: ShareOfTotalToggleProps) => {
  const shares = useGetGroupingShares();
  const toggleGroupShare = useToggleGroupShare();

  if (!isShareableAggregate(fn)) return;

  const isShared = shares.some(
    (share) => share.columnKey === columnKey && share.fn === fn,
  );
  const description = `${TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL} for ${label}`;

  return (
    <Button
      aria-label={description}
      aria-pressed={isShared}
      icon={<BarChartIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={() => {
        toggleGroupShare({ columnKey, fn });
      }}
      size='mini'
      tooltipContent={description}
      variant={isShared ? 'primary' : 'ghost'}
    />
  );
};
