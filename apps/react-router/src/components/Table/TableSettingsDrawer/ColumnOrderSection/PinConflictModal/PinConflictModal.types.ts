import type { PinConflictResolutionPreferenceOption } from '../ColumnOrderSection.types';

export type PinConflictModalProps = {
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly onAccept: (
    resolution: PinConflictResolutionPreferenceOption,
  ) => void;
  readonly onCancel: () => void;
  readonly side: 'left' | 'right';
};
