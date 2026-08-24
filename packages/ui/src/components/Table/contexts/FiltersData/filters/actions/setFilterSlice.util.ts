import type {
  DataKey,
  FilterData,
  FiltersDataState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

type SetFilterSliceArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter: FilterData;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
};

/**
 * `store.set` cannot type computed-key partial updates, so the one required assertion is
 * contained here — call sites must stay cast-free.
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
