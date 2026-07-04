import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableColumnSelectedKey = () => {
  const { metaStore } = useTableConfigContextValue();

  return (columnSelectedKey: string) => {
    metaStore.set({
      columnSelectedKey,
    });
  };
};
