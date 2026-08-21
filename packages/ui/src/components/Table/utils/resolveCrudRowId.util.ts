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
 * The row id used by CRUD links (`view/:id`, `edit/:id`) and the delete submit
 * payload, built from the primary-key column(s) — or `undefined` when this row
 * cannot produce one. A single primary key yields the raw (URL-encoded) value;
 * a composite key joins each encoded value with `PRIMARY_KEY_ID_DELIMITER`, in
 * column-declaration order.
 *
 * **It answers rather than throws, because its only caller renders.**
 * `TableRowActionsMenu` calls this during render, where a throw protects no
 * route — it takes the whole grid to an error boundary instead, which is what
 * one unresolvable row did (#887). Returning `undefined` moves the decision to
 * the caller, which renders no menu, so no bad id reaches a route either way:
 * the guarantee ADR-062 wanted from the throw, without the failure mode that
 * came with it.
 *
 * ADR-062 describes the throwing form and rejects it for `resolveRowKey`, which
 * degrades to the row's index. The same reasoning applied to the menu and was
 * not carried across; there is now one derivation and no throwing variant,
 * because nothing wanted one.
 */
export const resolveCrudRowId = <TData extends Record<string, unknown>>({
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
