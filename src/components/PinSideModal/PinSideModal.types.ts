import type { PinSide } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

export type PinSideModalProps = {
  columnLabel: string;
  isOpen: boolean;
  onAccept: (side: PinSide) => void;
  onCancel: () => void;
};
