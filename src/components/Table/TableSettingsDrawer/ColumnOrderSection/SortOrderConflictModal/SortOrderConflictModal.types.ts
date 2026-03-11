import type { SortOrderConflictResolution } from '../utils';

export type SortOrderConflictModalProps = {
  isOpen: boolean;
  onAccept: (resolution: SortOrderConflictResolution) => void;
  onCancel: () => void;
};
