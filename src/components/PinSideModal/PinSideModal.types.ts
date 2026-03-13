import type { PinSide } from '@/types/ui.types';

export type PinSideModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (side: PinSide) => void;
  onCancel: () => void;
};
