import type { TableColumn, TableCrudConfig } from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';
import { createActionsColumn } from './createActionsColumn.util';

type ResolveTableActionsColumnArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly crud?: TableCrudConfig;
};

export const resolveTableActionsColumn = <
  TData extends Record<string, unknown>,
>({
  columns,
  crud,
}: ResolveTableActionsColumnArgs<TData>) => {
  const customColumn = columns.find(
    (column) => column.key === ACTIONS_COLUMN_KEY,
  );
  const requiresRowActions =
    crud !== undefined &&
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
