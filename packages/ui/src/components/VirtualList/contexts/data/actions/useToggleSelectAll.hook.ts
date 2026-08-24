import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../../VirtualListContext.constants';
import { resolveSelectAllFilter } from './utils';

export const useToggleSelectAll = () => {
  const { dataStore, onChange } = useVirtualListContextValue();

  return () => {
    const dataState = dataStore.get() ?? INITIAL_LIST_DATA_STATE;

    onChange(
      resolveSelectAllFilter({
        filteredOptions: dataState.filteredOptions,
        isAllSelected: dataState.isAllSelected,
        selectedValues: dataState.selectedValues,
      }),
    );
  };
};
