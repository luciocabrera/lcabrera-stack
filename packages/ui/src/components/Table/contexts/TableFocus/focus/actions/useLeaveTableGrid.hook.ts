import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

/**
 * The stored row and column are deliberately left alone: leaving is how the grid gets
 * re-entered where it was left, and it is also what happens when the focused row is
 * unmounted by a scroll — the row is still the focus target, it just has no node right
 * now.
 */
export const useLeaveTableGrid = () => {
  const { focusStore } = useTableFocusContextValue();

  return () => {
    if (focusStore.get().isGridFocused)
      focusStore.set({ isGridFocused: false });
  };
};
