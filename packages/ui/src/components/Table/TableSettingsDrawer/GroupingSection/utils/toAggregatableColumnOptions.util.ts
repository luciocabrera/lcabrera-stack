import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

type ToAggregatableColumnOptionsArgs<TData extends Record<string, unknown>> = {
  readonly capabilities: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The columns an aggregate may be applied to, as select options.
 *
 * Driven off the **capability** rather than off `TableColumn.dataType`: the
 * declared type is a five-member presentation vocabulary that reports
 * `numeric`, `jsonb` and `point` alike as `string` (#550), so it can neither
 * admit nor exclude an aggregable column reliably. A column the catalogue
 * offers nothing for is not offered here.
 *
 * Iterating the columns rather than the capability map is what keeps the list
 * in the table's own display order and gives each option a human label.
 */
export const toAggregatableColumnOptions = <
  TData extends Record<string, unknown>,
>({
  capabilities,
  columns,
}: ToAggregatableColumnOptionsArgs<TData>) =>
  columns
    .filter(
      (column) =>
        (capabilities[String(column.key)]?.aggregates.length ?? 0) > 0,
    )
    .map((column) => ({ label: column.label, value: String(column.key) }));
