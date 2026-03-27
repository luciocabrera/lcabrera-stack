import { useTableConfigContextValue } from "../../useTableConfigContextValue.hook.ts";

export const useSetTableColumnSelectedKey = () => {
  const { metaStore } = useTableConfigContextValue();

  return (columnSelectedKey: string) => {
    metaStore.set({
      columnSelectedKey,
    });
  };
};
