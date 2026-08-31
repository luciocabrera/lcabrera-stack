import type { TableColumn } from '#ui/components/Table/Table.types';

import { PRIMARY_KEY_ID_DELIMITER } from '#ui/components/Table/Table.constants';

import { resolvePrimaryKeyColumnKeys } from './resolvePrimaryKeyColumnKeys.util';

type ResolveCrudRowIdArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly row: TData;
};

const isValidIdValue = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';

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
