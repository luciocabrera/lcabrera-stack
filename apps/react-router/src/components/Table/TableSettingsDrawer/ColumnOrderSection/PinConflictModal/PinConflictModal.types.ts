import type { PinConflictResolution } from '../ColumnOrderSection.types';

export type PinConflictModalProps = {
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly onAccept: (resolution: PinConflictResolution) => void;
  readonly onCancel: () => void;
  readonly side: 'left' | 'right';
};
