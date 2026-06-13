import type {
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

type GetColumnPinSideArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly pinning: ColumnPinningState<TData> | undefined;
};

export const getColumnPinSide = <TData = Record<string, unknown>>({
  columnKey,
  pinning,
}: GetColumnPinSideArgs<TData>): 'left' | 'right' | undefined => {
  if (pinning?.left.includes(columnKey)) return 'left';
  if (pinning?.right.includes(columnKey)) return 'right';
  return undefined;
};
