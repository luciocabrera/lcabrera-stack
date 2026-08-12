import type {
  FilterOptionsTransport,
  TableColumn,
} from '#ui/components/Table/Table.types';

type AppendDistinctFilterDescriptorsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly schemaName?: string;
  readonly tableName: string;
  readonly transport: FilterOptionsTransport;
};

/**
 * Loader-side decorator: attaches a `kind: 'distinct'` filter-options
 * descriptor to every filterable string column that doesn't already carry
 * a descriptor (static enums keep theirs). Pure and fully serializable —
 * works identically for hardcoded column constants and future
 * DB-introspected columns (`columnName` comes from `column.key`,
 * schema/table from the route, transport from app config).
 */
export const appendDistinctFilterDescriptors = <TData>({
  columns,
  schemaName,
  tableName,
  transport,
}: AppendDistinctFilterDescriptorsArgs<TData>) =>
  columns.map((column) => {
    const isDistinctCandidate =
      column.dataType === 'string' &&
      column.isFilterable !== false &&
      column.filterOptionsDescriptor === undefined;

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
