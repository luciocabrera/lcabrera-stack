import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';
import { resolveToggleOptionFilter } from './utils';

export const useToggleOption = () => {
  const { dataStore, onChange } = useVirtualListContextValue();

  return (option: string) => {
    const dataState = dataStore.get();
    const selectedValues = dataState?.selectedValues ?? [];

    onChange(resolveToggleOptionFilter({ option, selectedValues }));
  };
};
