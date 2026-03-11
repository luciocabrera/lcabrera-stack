import type { PinSide } from '../ColumnOrderSection.types';

export type PinSideModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (side: PinSide) => void;
  onCancel: () => void;
};
