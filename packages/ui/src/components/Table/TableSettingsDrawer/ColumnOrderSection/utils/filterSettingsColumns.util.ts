import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  columns.filter(
    (col) => !col.render || resolveColumnCapabilities(col).isStatic,
  );
