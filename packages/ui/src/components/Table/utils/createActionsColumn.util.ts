import type { TableColumn } from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';

type CreateActionsColumnOverrides<TData extends Record<string, unknown>> =
  Partial<TableColumn<TData>>;

/**
 * Builds the row-actions column: pinned, non-filterable, non-sortable,
 * non-resizable, and static by default. Consumers only need to pass
 * overrides (typically `render`, to append custom per-row menu content) —
 * `key` is always forced back to `'actions'` regardless of what's passed.
 */
export const createActionsColumn = <TData extends Record<string, unknown>>(
  overrides: CreateActionsColumnOverrides<TData> = {},
): TableColumn<TData> => {
  return {
    isFilterable: false,
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
