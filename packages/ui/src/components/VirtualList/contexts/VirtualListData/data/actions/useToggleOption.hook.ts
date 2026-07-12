import { useVirtualListConfigContextValue } from '../../../VirtualListConfig/useVirtualListConfigContextValue.hook';
import { useVirtualListDataContextValue } from '../../useVirtualListDataContextValue.hook';
import { resolveToggleOptionFilter } from './utils';

/**
 * Toggles a single option's selection. Selection is parent-owned, so the
 * next filter is emitted through `onChange` instead of written to the store.
 */
export const useToggleOption = () => {
  const { onChange } = useVirtualListConfigContextValue();
  const { dataStore } = useVirtualListDataContextValue();

  return (option: string) => {
    const dataState = dataStore.get();
    const selectedValues = dataState?.selectedValues ?? [];

    onChange(resolveToggleOptionFilter({ option, selectedValues }));
  };
};
