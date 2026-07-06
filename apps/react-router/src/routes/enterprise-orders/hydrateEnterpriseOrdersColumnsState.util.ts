import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';

import type { EnterpriseOrder } from '@/services';

import { COLUMNS } from './EnterpriseOrders.constants';

const ACTIONS_COLUMN_KEY = 'actions';

/**
 * Rehydrate non-serializable column definitions (render/filter callbacks)
 * after loader data crosses the server/client boundary.
 */
export const hydrateEnterpriseOrdersColumnsState = (
  columnsState: Omit<
    TableColumnsState<EnterpriseOrder>,
    | 'columnGroups'
    | 'effectiveColumns'
    | 'normalizedColumns'
    | 'pinnedColumnOffsets'
    | 'staticKeys'
  >,
): Omit<
  TableColumnsState<EnterpriseOrder>,
  | 'columnGroups'
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'staticKeys'
> => {
  const pinnedLeft = columnsState.columnPinning.left.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );
  const pinnedRight = columnsState.columnPinning.right.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );

  return {
    ...columnsState,
    columnPinning: {
      left: pinnedLeft,
      right: [...pinnedRight, ACTIONS_COLUMN_KEY],
    },
    columns: COLUMNS,
  };
};
