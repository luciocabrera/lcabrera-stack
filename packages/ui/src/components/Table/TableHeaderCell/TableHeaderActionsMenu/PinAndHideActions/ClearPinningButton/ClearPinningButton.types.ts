import type {
  DataKey,
  TableColumnLayoutLock,
} from '#ui/components/Table/Table.types';

export type ClearPinningButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly layoutLock?: TableColumnLayoutLock;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
