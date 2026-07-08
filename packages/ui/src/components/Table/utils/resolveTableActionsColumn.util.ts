import type { TableColumn, TableCrudConfig } from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';
import { createActionsColumn } from './createActionsColumn.util';

type ResolveTableActionsColumnArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly crud?: TableCrudConfig;
};

type ResolveTableActionsColumnResult<TData extends Record<string, unknown>> = {
  readonly columns: TableColumn<TData>[];
  readonly hasActionsColumn: boolean;
};

/**
 * Resolves the final columns array for a table, synthesizing the row-actions
 * column when `crud` enables a row-level operation (`read`/`update`/`delete`
 * — `create` alone only drives the header create-link and never needs a row
 * id, so it's deliberately excluded here) or when the consumer already
 * declared a `key: 'actions'` column (for a pure custom-actions menu with no
 * CRUD flags at all). Any consumer-supplied `actions` column is merged onto
 * `createActionsColumn`'s defaults, so only the fields the consumer cares
 * about (typically `render`) need to be specified. Also returns
 * `hasActionsColumn` so callers (e.g. pinning logic) don't need to re-derive
 * it by scanning the resolved columns again.
 */
export const resolveTableActionsColumn = <
  TData extends Record<string, unknown>,
>({
  columns,
  crud,
}: ResolveTableActionsColumnArgs<TData>): ResolveTableActionsColumnResult<TData> => {
  const customColumn = columns.find(
    (column) => column.key === ACTIONS_COLUMN_KEY,
  );
  const requiresRowActions =
    !!crud &&
    (crud.read === true || crud.update === true || crud.delete === true);

  if (!requiresRowActions && !customColumn) {
    return { columns: [...columns], hasActionsColumn: false };
  }

  const resolvedColumn = createActionsColumn<TData>(customColumn);

  return {
    columns: [
      ...columns.filter((column) => column.key !== ACTIONS_COLUMN_KEY),
      resolvedColumn,
    ],
    hasActionsColumn: true,
  };
};
