import type {
  DataKey,
  FilterData,
  FiltersDataState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

type SetFilterSliceArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter: FilterData;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
};

/**
 * Write a single column's FilterData slice into the filters-data store.
 *
 * `store.set` cannot type computed-key partial updates, so the one required
 * assertion is contained here — call sites must stay cast-free.
 * @param args - Target store, column key, and the full FilterData slice.
 */
export const setFilterSlice = <TData>({
  columnKey,
  filter,
  filtersDataStore,
}: SetFilterSliceArgs<TData>) => {
  filtersDataStore.set({
    [columnKey]: filter,
  } as Partial<FiltersDataState<TData>>);
};
