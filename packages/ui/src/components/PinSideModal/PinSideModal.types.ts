import type { PinSide } from '#ui/types/ui.types';

export type PinSideModalProps = {
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly onAccept: (side: PinSide) => void;
  readonly onCancel: () => void;
};
