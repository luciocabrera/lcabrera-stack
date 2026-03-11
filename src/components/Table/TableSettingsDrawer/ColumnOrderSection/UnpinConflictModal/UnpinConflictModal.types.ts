import type { UnpinConflictResolution } from '../ColumnOrderSection.types';

export type UnpinConflictModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (resolution: UnpinConflictResolution) => void;
  onCancel: () => void;
  side: 'left' | 'right';
};
