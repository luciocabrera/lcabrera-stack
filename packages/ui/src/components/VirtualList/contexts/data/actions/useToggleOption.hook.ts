import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';
import { resolveToggleOptionFilter } from './utils';

/**
 * Toggles a single option's selection. Selection is parent-owned, so the
 * next filter is emitted through `onChange` instead of written to the store.
 */
export const useToggleOption = () => {
  const { dataStore, onChange } = useVirtualListContextValue();

  return (option: string) => {
    const dataState = dataStore.get();
    const selectedValues = dataState?.selectedValues ?? [];

    onChange(resolveToggleOptionFilter({ option, selectedValues }));
  };
};
