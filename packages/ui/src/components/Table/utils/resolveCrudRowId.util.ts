import type { TableColumn } from '#ui/components/Table/Table.types';

import { PRIMARY_KEY_ID_DELIMITER } from '#ui/components/Table/Table.constants';

import { resolvePrimaryKeyColumnKeys } from './resolvePrimaryKeyColumnKeys.util';

type ResolveCrudRowIdArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly row: TData;
};

const isValidIdValue = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';

/**
 * The row id, or `undefined` when this row cannot produce one.
 *
 * The non-throwing half of the pair, for callers on the **render path**.
 * ADR-062 already drew this line for row keys: a throw is correct for a CRUD
 * link, where a bad id must not reach a route, and wrong where the same throw
 * empties the table. The derivation is shared and the failure handling is not —
 * `resolveRowKey` degrades to the row's index, and a row-actions menu renders
 * no menu.
 *
 * That reasoning was applied to `resolveRowKey` and not to
 * `TableRowActionsMenu`, which is also on the render path and kept the throwing
 * call — so one unresolvable row took the whole grid to an error boundary.
 */
export const tryResolveCrudRowId = <TData extends Record<string, unknown>>({
  columns,
  row,
}: ResolveCrudRowIdArgs<TData>) => {
  const primaryKeyKeys = resolvePrimaryKeyColumnKeys({ columns });

  if (primaryKeyKeys.length === 0) return;

  const values = primaryKeyKeys.map((key) => row[key]);

  return values.every(isValidIdValue)
    ? values
        .map((value) => encodeURIComponent(String(value)))
        .join(PRIMARY_KEY_ID_DELIMITER)
    : undefined;
};

/**
 * Build the row id used by CRUD links (`view/:id`, `edit/:id`) and the delete
 * submit payload from the primary-key column(s). A single primary key yields
 * the raw (URL-encoded) value; a composite key joins each encoded value with
 * `PRIMARY_KEY_ID_DELIMITER`, in column-declaration order.
 *
 * **Throws**, which is why it must not be called during render — see
 * {@link tryResolveCrudRowId}.
 */
export const resolveCrudRowId = <TData extends Record<string, unknown>>({
  columns,
  row,
}: ResolveCrudRowIdArgs<TData>) => {
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
