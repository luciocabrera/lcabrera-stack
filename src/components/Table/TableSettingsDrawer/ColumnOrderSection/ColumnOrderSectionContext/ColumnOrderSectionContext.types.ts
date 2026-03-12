import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type ColumnOrderSectionContextValue = {
  /** Store managing column order section modal state */
  modalsStore: TStore<ColumnOrderSectionModalsState>;
};

export type ColumnOrderSectionModalsState = {
  conflictModal: ConflictModalState;
  orderConflict: OrderConflictModalState;
  pinSideModal: PinSideModalState;
  unpinConflictModal: ConflictModalState;
};

export type ColumnOrderSectionProviderProps = {
  children: React.ReactNode;
};

export type ConflictModalState = {
  columnKey: string;
  columnLabel: string;
  isOpen: boolean;
  side: 'left' | 'right';
};

export type OrderConflictModalState = {
  description: string;
  isOpen: boolean;
  pendingOrder: ColumnOrderState;
  pendingPinning: ColumnPinningState;
};

export type PinSideModalState = {
  columnKey: string;
  columnLabel: string;
  isOpen: boolean;
};
