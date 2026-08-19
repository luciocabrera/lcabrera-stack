import { Button } from '#ui/components/Button';
import { BarChartIcon } from '#ui/components/Icons';
import { isShareableAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL } from '#ui/components/Table/Table.constants';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { ShareOfTotalToggleProps } from './ShareOfTotalToggle.types';

import { useToggleGroupShare } from '../../../TableDrawerContext/actions';
import {
  useGetGroupingAggregates,
  useGetGroupingShares,
} from '../../../TableDrawerContext/selectors';

/**
 * Turns one column's share of the grand total on or off.
 *
 * **It renders nothing where a share is not defined**, which is every aggregate
 * but `sum` and `count`. That is the same shape `GroupKeyPeriodSelect` takes on
 * a non-temporal key, and for the same reason: an inert control on a column
 * that can never carry the thing it offers reads as a bug.
 *
 * The label names the denominator rather than the operation — "share of grand
 * total", not "show percentage" — because which total is being divided by is
 * the decision a reader has to be able to make out (ADR-086), and this control
 * is where it is chosen.
 */
export const ShareOfTotalToggle = ({
  columnKey,
  isBusy = false,
  label,
}: ShareOfTotalToggleProps) => {
  const aggregates = useGetGroupingAggregates();
  const shares = useGetGroupingShares();
  const toggleGroupShare = useToggleGroupShare();

  if (!isShareableAggregate(aggregates[columnKey])) return;

  const isShared = shares.includes(columnKey);
  const description = `${TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL} for ${label}`;

  return (
    <Button
      aria-label={description}
      aria-pressed={isShared}
      icon={<BarChartIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={() => {
        toggleGroupShare(columnKey);
      }}
      size='mini'
      tooltipContent={description}
      variant={isShared ? 'primary' : 'ghost'}
    />
  );
};
