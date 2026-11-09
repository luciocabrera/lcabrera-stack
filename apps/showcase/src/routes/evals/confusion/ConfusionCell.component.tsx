import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';
import { Text } from '@lcabrera/ui/components/Text';

import type { ConfusionCellProps } from './EvalsConfusion.types';

import { EMPTY_CELL } from './EvalsConfusion.constants';

export const ConfusionCell = ({ cell }: ConfusionCellProps) => {
  if (cell === undefined || cell.count === 0) {
    return (
      <Text as='span' tone='tertiary'>
        {EMPTY_CELL}
      </Text>
    );
  }

  return cell.isMisload ? (
    <StatusBadge label={cell.label} tone='error' />
  ) : (
    cell.label
  );
};
