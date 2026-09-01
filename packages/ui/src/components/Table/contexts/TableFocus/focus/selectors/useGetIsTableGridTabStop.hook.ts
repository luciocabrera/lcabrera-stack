import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

export const useGetIsTableGridTabStop = () =>
  useFocusStore((state) => !state.isGridFocused || state.rowKey === undefined);
