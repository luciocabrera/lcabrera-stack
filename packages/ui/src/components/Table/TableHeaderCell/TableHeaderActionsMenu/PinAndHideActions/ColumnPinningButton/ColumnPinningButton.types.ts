import type {
  DataKey,
  TableColumnLayoutLock,
} from '#ui/components/Table/Table.types';

export type ColumnPinningButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly layoutLock?: TableColumnLayoutLock;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
  readonly target: ColumnPinningTarget;
};

export type ColumnPinningTarget = 'clear' | 'left' | 'right';
