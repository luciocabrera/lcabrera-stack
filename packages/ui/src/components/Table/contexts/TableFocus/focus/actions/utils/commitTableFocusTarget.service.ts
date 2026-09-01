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
