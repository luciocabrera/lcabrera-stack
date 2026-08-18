import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

type ToAggregatableColumnOptionsArgs<TData extends Record<string, unknown>> = {
  readonly capabilities: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly columns: readonly TableColumn<TData>[];
  /** The keys currently staged in the drawer draft. */
  readonly groupingKeys: readonly string[];
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
 *
 * **A column that is already a group key is not offered** (ADR-080). Under one
 * column per key that column renders its key's value, so an aggregate selected
 * on it could never be shown. The picker is not the rule, though — the grouping
 * configuration is URL state, so a request can always name one column as both,
 * and `resolveGroupCellChildren` is where the key actually wins. This keeps the
 * menu from offering a choice the rendering would then drop.
 */
export const toAggregatableColumnOptions = <
  TData extends Record<string, unknown>,
>({
  capabilities,
  columns,
  groupingKeys,
}: ToAggregatableColumnOptionsArgs<TData>) => {
  const groupKeys = new Set(groupingKeys);

  return columns
    .filter(
      (column) =>
        !groupKeys.has(String(column.key)) &&
        (capabilities[String(column.key)]?.aggregates.length ?? 0) > 0,
    )
    .map((column) => ({ label: column.label, value: String(column.key) }));
};
