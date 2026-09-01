import { DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

type ResolveAggregateColumnMinWidthArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

export const resolveAggregateColumnMinWidth = ({
  maxWidth,
  minWidth,
}: ResolveAggregateColumnMinWidthArgs) => {
  const floor = Math.max(minWidth ?? 0, DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH);

  return maxWidth === undefined ? floor : Math.min(floor, maxWidth);
};
