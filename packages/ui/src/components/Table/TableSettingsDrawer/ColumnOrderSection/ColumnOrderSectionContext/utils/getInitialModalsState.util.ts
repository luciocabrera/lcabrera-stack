import type { ColumnOrderSectionModalsState } from '../ColumnOrderSectionContext.types';

import { INITIAL_MODALS_STATE } from '../ColumnOrderSectionContext.constants';

type GetInitialModalsStateArgs = Partial<ColumnOrderSectionModalsState>;

export const getInitialModalsState = ({
  columnGroupingPrompt = INITIAL_MODALS_STATE.columnGroupingPrompt,
  conflictModal = INITIAL_MODALS_STATE.conflictModal,
  orderConflict = INITIAL_MODALS_STATE.orderConflict,
  pinSideModal = INITIAL_MODALS_STATE.pinSideModal,
  unpinConflictModal = INITIAL_MODALS_STATE.unpinConflictModal,
}: GetInitialModalsStateArgs = {}) => ({
  columnGroupingPrompt,
  conflictModal,
  orderConflict,
  pinSideModal,
  unpinConflictModal,
});
