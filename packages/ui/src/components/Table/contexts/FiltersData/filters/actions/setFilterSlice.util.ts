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

export const setFilterSlice = <TData>({
  columnKey,
  filter,
  filtersDataStore,
}: SetFilterSliceArgs<TData>) => {
  filtersDataStore.set({
    [columnKey]: filter,
  } as Partial<FiltersDataState<TData>>);
};
