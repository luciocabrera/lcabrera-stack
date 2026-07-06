import type {
  TableCrudId,
  TableCrudIdAccessor,
} from '@repo/ui/components/Table/Table.types';

type ResolveCrudRowIdArgs<TData extends Record<string, unknown>> = {
  readonly idAccessor: TableCrudIdAccessor<TData>;
  readonly row: TData;
};

const isValidCrudId = (value: unknown): value is TableCrudId =>
  typeof value === 'number' || typeof value === 'string';

export const resolveCrudRowId = <TData extends Record<string, unknown>>({
  idAccessor,
  row,
}: ResolveCrudRowIdArgs<TData>): TableCrudId => {
  if (typeof idAccessor === 'function') {
    const resolvedId = idAccessor(row);

    if (!isValidCrudId(resolvedId)) {
      throw new TypeError(
        'crud.idAccessor function must return string or number',
      );
    }

    return resolvedId;
  }

  const resolvedId = row[idAccessor];

  if (!isValidCrudId(resolvedId)) {
    throw new TypeError(
      `crud.idAccessor key "${idAccessor}" must resolve to string or number`,
    );
  }

  return resolvedId;
};
