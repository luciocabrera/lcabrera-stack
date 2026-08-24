import { Button } from '#ui/components/Button';
import { BarChartIcon } from '#ui/components/Icons';
import { isShareableAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL } from '#ui/components/Table/Table.constants';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { ShareOfTotalToggleProps } from './ShareOfTotalToggle.types';

import { useToggleGroupShare } from '../../../TableDrawerContext/actions';
import { useGetGroupingShares } from '../../../TableDrawerContext/selectors';

/**
 * Renders nothing where a share is not defined. The label names the
 * denominator (ADR-086), not the operation.
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
