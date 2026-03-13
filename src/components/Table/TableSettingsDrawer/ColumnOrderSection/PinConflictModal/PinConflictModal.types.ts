import type { PinConflictResolution } from '../ColumnOrderSection.types';

export type PinConflictModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (resolution: PinConflictResolution) => void;
  onCancel: () => void;
  side: 'left' | 'right';
};
