import type {
  StaticFilterOptionsDescriptor,
  TableColumn,
} from '#ui/components/Table/Table.types';

type StaticFilterOptions<TData> = Pick<
  TableColumn<TData>,
  'filterOptionsDescriptor'
>;

/**
 * Creates a serializable static filter-options descriptor for a list of
 * values known at build time. Safe to return from loaders (no functions);
 * the client tool (`resolveFilterOptionsDescriptor`) serves pages by
 * slicing the values client-side, no API call involved.
 *
 * @example
 * ```ts
 * {
 *   dataType: 'string',
 *   ...createStaticFilterOptions(['Pending', 'Shipped', 'Delivered']),
 *   key: 'status',
 *   label: 'Status',
 * }
 * ```
 */
export const createStaticFilterOptions = <TData>(
  values: readonly string[],
): StaticFilterOptions<TData> => ({
  filterOptionsDescriptor: {
    kind: 'static',
    values,
  } satisfies StaticFilterOptionsDescriptor,
});
