import type { TableCrudConfig } from '@repo/ui/components/Table/Table.types';

type ValidateTableCrudConfigArgs<TData extends Record<string, unknown>> = {
  readonly crud?: TableCrudConfig<TData>;
};

export const validateTableCrudConfig = <TData extends Record<string, unknown>>({
  crud,
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

  if (crud.delete && !crud.deleteActionPath) {
    throw new TypeError(
      'Table crud delete operation requires deleteActionPath',
    );
  }
};
