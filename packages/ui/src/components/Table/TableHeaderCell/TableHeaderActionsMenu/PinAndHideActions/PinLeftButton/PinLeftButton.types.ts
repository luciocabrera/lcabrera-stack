import type {
  DataKey,
  TableColumnLayoutLock,
} from '#ui/components/Table/Table.types';

export type PinLeftButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly layoutLock?: TableColumnLayoutLock;
  readonly onClose: () => void;
  readonly pinSide?: 'left' | 'right';
};
