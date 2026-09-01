import type {
  StaticFilterOptionsDescriptor,
  TableColumn,
} from '#ui/components/Table/Table.types';

type StaticFilterOptions<TData> = Pick<
  TableColumn<TData>,
  'filterOptionsDescriptor'
>;

export const createStaticFilterOptions = <TData>(
  values: readonly string[],
): StaticFilterOptions<TData> => ({
  filterOptionsDescriptor: {
    kind: 'static',
    values,
  } satisfies StaticFilterOptionsDescriptor,
});
