import type {
  FilterOptionsTransport,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type AppendDistinctFilterDescriptorsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly schemaName?: string;
  readonly tableName: string;
  readonly transport: FilterOptionsTransport;
};

export const appendDistinctFilterDescriptors = <TData>({
  columns,
  schemaName,
  tableName,
  transport,
}: AppendDistinctFilterDescriptorsArgs<TData>) =>
  columns.map((column) => {
    const isDistinctCandidate =
      column.dataType === 'string' &&
      column.filterOptionsDescriptor === undefined &&
      resolveColumnCapabilities(column).isFilterable;

    if (!isDistinctCandidate) {
      return column;
    }

    return {
      ...column,
      filterOptionsDescriptor: {
        kind: 'distinct' as const,
        params: {
          columnName: String(column.key),
          ...(schemaName !== undefined && { schemaName }),
          tableName,
        },
        transport,
      },
    };
  });
