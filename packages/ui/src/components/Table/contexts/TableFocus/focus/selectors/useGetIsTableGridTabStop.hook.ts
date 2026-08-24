import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

/**
 * The two conditions together are what keeps the count at exactly one: a focused row that
 * scrolls out of the window is unmounted, DOM focus leaves the grid, `isGridFocused` goes
 * false on the container's own blur, and the container takes the tab stop back while the
 * stored target waits (ADR-062).
 */
export const useGetIsTableGridTabStop = () =>
  useFocusStore((state) => !state.isGridFocused || state.rowKey === undefined);
