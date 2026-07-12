import { useVirtualListConfigContextValue } from '../../../VirtualListConfig/useVirtualListConfigContextValue.hook';
import { useVirtualListDataContextValue } from '../../useVirtualListDataContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../../VirtualListDataContext.constants';
import { resolveSelectAllFilter } from './utils';

/**
 * Toggles selection of every currently visible (filtered) option, reading
 * the pre-computed derived state from the data-store snapshot. Selection is
 * parent-owned, so the next filter is emitted through `onChange`.
 */
export const useToggleSelectAll = () => {
  const { onChange } = useVirtualListConfigContextValue();
  const { dataStore } = useVirtualListDataContextValue();

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
