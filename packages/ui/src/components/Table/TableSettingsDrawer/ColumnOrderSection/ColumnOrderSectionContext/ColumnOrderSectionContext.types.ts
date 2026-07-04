import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

export type ColumnOrderSectionContextValue = {
  /** Store managing column order section modal state */
  readonly modalsStore: TStore<ColumnOrderSectionModalsState>;
};

export type ColumnOrderSectionModalsState = {
  readonly conflictModal: ConflictModalState;
  readonly orderConflict: OrderConflictModalState;
  readonly pinSideModal: PinSideModalState;
  readonly unpinConflictModal: ConflictModalState;
};

export type ColumnOrderSectionProviderProps = {
  readonly children: React.ReactNode;
};

export type ConflictModalState = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly side: 'left' | 'right';
};

export type OrderConflictModalState = {
  readonly description: string;
  readonly isOpen: boolean;
  readonly pendingOrder: ColumnOrderState;
  readonly pendingPinning: ColumnPinningState;
};

export type PinSideModalState = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
};
