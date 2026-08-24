import type { TableColumn } from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';

type CreateActionsColumnOverrides<TData extends Record<string, unknown>> =
  Partial<TableColumn<TData>>;

/**
 * `isGroupable: false` is declared here rather than derived from the key, so "may this
 * column be a group key" stays one question with one answer (`resolveColumnCapabilities`)
 * instead of a `key === 'actions'` test copied into every surface that offers grouping.
 */
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
