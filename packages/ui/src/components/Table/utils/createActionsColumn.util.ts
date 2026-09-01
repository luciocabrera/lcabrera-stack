import type { TableColumn } from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';

type CreateActionsColumnOverrides<TData extends Record<string, unknown>> =
  Partial<TableColumn<TData>>;

export const createActionsColumn = <TData extends Record<string, unknown>>(
  overrides: CreateActionsColumnOverrides<TData> = {},
) => {
  return {
    isFilterable: false,
    isGroupable: false,
    isHeaderHidden: true,
    isResizable: false,
    isSortable: false,
    isStatic: true,
    label: 'Actions',
    maxWidth: 32,
    minWidth: 32,
    ...overrides,
    key: ACTIONS_COLUMN_KEY,
  };
};
