import type { SortOrderConflictResolution } from '../ColumnOrderSection.types';

export type SortOrderConflictModalProps = {
  isOpen: boolean;
  onAccept: (resolution: SortOrderConflictResolution) => void;
  onCancel: () => void;
};
