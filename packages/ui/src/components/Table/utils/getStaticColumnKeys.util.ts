import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

export const getStaticColumnKeys = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  new Set<string>(
    columns
      .filter((col) => resolveColumnCapabilities(col).isStatic)
      .map((col) => col.key),
  );
