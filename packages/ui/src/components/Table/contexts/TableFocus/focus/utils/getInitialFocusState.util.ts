import type { TableFocusState } from '#ui/components/Table/Table.types';

/**
 * The focus store's starting state: no cell targeted and no focus inside the
 * grid, so the grid container is the tab stop and nothing steals focus on
 * mount.
 *
 * `focusRequestId` starts at zero and is only ever incremented, which is what
 * lets a cell tell "nobody has asked for focus yet" from "I am the cell being
 * asked for".
 */
export const getInitialFocusState = (): TableFocusState => ({
  columnKey: undefined,
  focusRequestId: 0,
  isGridFocused: false,
  rowIndex: undefined,
  rowKey: undefined,
});
