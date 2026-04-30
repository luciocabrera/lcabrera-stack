import type { PinSidePreferenceOption } from '@/types/pinningPreferences.types';

export type PinSideModalProps = {
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly onAccept: (side: PinSidePreferenceOption) => void;
  readonly onCancel: () => void;
};
