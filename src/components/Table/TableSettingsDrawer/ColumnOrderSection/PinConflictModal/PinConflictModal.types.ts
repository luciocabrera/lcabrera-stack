export type PinConflictModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (resolution: PinConflictResolution) => void;
  onCancel: () => void;
  side: 'left' | 'right';
};

export type PinConflictResolution = 'move-column' | 'pin-all-between';
