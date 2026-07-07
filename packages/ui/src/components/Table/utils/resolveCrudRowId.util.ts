import type { TableColumn } from '@repo/ui/components/Table/Table.types';

import { PRIMARY_KEY_ID_DELIMITER } from '@repo/ui/components/Table/Table.constants';

import { resolvePrimaryKeyColumnKeys } from './resolvePrimaryKeyColumnKeys.util';

type ResolveCrudRowIdArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly row: TData;
};

const isValidIdValue = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';

/**
 * Build the row id used by CRUD links (`view/:id`, `edit/:id`) and the delete
 * submit payload from the primary-key column(s). A single primary key yields
 * the raw (URL-encoded) value; a composite key joins each encoded value with
 * `PRIMARY_KEY_ID_DELIMITER`, in column-declaration order.
 */
export const resolveCrudRowId = <TData extends Record<string, unknown>>({
  columns,
  row,
}: ResolveCrudRowIdArgs<TData>): string => {
  const primaryKeyKeys = resolvePrimaryKeyColumnKeys({ columns });

  if (primaryKeyKeys.length === 0) {
    throw new TypeError(
      'Table crud requires at least one column with isPrimaryKey to resolve a row id',
    );
  }

  return primaryKeyKeys
    .map((key) => {
      const value = row[key];

      if (!isValidIdValue(value)) {
        throw new TypeError(
          `Primary-key column "${String(key)}" must resolve to string or number`,
        );
      }

      return encodeURIComponent(String(value));
    })
    .join(PRIMARY_KEY_ID_DELIMITER);
};
