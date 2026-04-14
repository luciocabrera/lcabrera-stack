import type { ColumnOrderState } from '@/components/Table/Table.types';

import type { ColumnOrderSectionModalsState } from './ColumnOrderSectionContext.types';

export const INITIAL_MODALS_STATE: ColumnOrderSectionModalsState = {
  conflictModal: {
    columnKey: '',
    columnLabel: '',
    isOpen: false,
    side: 'left',
  },
  orderConflict: {
    description: '',
    isOpen: false,
    pendingOrder: [] as unknown as ColumnOrderState,
    pendingPinning: { left: [], right: [] },
  },
  pinSideModal: { columnKey: '', columnLabel: '', isOpen: false },
  unpinConflictModal: {
    columnKey: '',
    columnLabel: '',
    isOpen: false,
    side: 'left',
  },
};
