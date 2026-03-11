import type { OrderConflictResolution } from '../ColumnOrderSection.types';

export type OrderConflictModalProps = {
  description: string;
  isOpen: boolean;
  onAccept: (resolution: OrderConflictResolution) => void;
  onCancel: () => void;
};
