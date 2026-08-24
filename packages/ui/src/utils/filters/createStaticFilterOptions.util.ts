import type {
  StaticFilterOptionsDescriptor,
  TableColumn,
} from '#ui/components/Table/Table.types';

type StaticFilterOptions<TData> = Pick<
  TableColumn<TData>,
  'filterOptionsDescriptor'
>;

/**
 * Creates a serializable static filter-options descriptor for a list of values known at
 * build time.
 */
export const createStaticFilterOptions = <TData>(
  values: readonly string[],
): StaticFilterOptions<TData> => ({
  filterOptionsDescriptor: {
    kind: 'static',
    values,
  } satisfies StaticFilterOptionsDescriptor,
});
