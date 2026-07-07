import type {
  TableColumn,
  TableCrudConfig,
} from '@repo/ui/components/Table/Table.types';

import { resolvePrimaryKeyColumnKeys } from './resolvePrimaryKeyColumnKeys.util';

type ValidateTableCrudConfigArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly crud?: TableCrudConfig;
  readonly deleteActionPath?: string;
};

export const validateTableCrudConfig = <TData extends Record<string, unknown>>({
  columns,
  crud,
  deleteActionPath,
}: ValidateTableCrudConfigArgs<TData>) => {
  if (!crud) return;

  const hasEnabledOperation =
    crud.create === true ||
    crud.delete === true ||
    crud.read === true ||
    crud.update === true;

  if (!hasEnabledOperation) {
    throw new TypeError(
      'Table crud config requires at least one enabled operation',
    );
  }

  const requiresRowId =
    crud.delete === true || crud.read === true || crud.update === true;

  if (requiresRowId && resolvePrimaryKeyColumnKeys({ columns }).length === 0) {
    throw new TypeError(
      'Table crud read/update/delete operations require at least one column with isPrimaryKey',
    );
  }

  if (crud.delete && !deleteActionPath) {
    throw new TypeError(
      'Table crud delete operation requires deleteActionPath',
    );
  }
};
