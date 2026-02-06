import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

export const useResetColumnFilter = () => {
  const { columnsStore } = useTableDrawerContextValue();

  const columnsState = columnsStore.get();

  return (columnKey: string) => {
    const current = columnsState?.columnFilters ?? {};
    const { [columnKey]: unusedFilter, ...rest } = current;
    void unusedFilter; // Explicitly mark as intentionally unused

    columnsStore.set({ columnFilters: rest });
  };
};
