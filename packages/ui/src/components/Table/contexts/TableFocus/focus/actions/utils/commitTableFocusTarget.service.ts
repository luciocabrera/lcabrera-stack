import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { scrollRowIntoView } from './scrollRowIntoView.service';
import { setTableFocusTarget } from './setTableFocusTarget.service';

type CommitTableFocusTargetArgs = {
  readonly columnKey: string;
  readonly container: HTMLElement | null | undefined;
  readonly focusStore: TStore<TableFocusState>;
  readonly rowHeight: number;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * The scroll happens before the store write, in that order, because that is the order
 * ADR-062 specifies for a move whose target lies outside the rendered window: bring the
 * row in, then ask for focus, so the request is already outstanding when the row mounts
 * and is honoured on its first effect rather than needing a second pass.
 */
export const commitTableFocusTarget = ({
  columnKey,
  container,
  focusStore,
  rowHeight,
  rowIndex,
  rowKey,
}: CommitTableFocusTargetArgs) => {
  scrollRowIntoView({ container, rowHeight, rowIndex });

  setTableFocusTarget({ columnKey, focusStore, rowIndex, rowKey });
};
