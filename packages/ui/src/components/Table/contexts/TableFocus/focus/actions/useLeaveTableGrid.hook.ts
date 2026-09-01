import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

export const useLeaveTableGrid = () => {
  const { focusStore } = useTableFocusContextValue();

  return () => {
    if (focusStore.get().isGridFocused)
      focusStore.set({ isGridFocused: false });
  };
};
