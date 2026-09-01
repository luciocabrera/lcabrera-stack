import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

type SetTableFocusTargetArgs = {
  readonly columnKey: string;
  readonly focusStore: TStore<TableFocusState>;
  readonly rowIndex: number;
  readonly rowKey: string;
};

export const setTableFocusTarget = ({
  columnKey,
  focusStore,
  rowIndex,
  rowKey,
}: SetTableFocusTargetArgs) => {
  const state = focusStore.get();

  focusStore.set({
    columnKey,
    focusRequestId: state.focusRequestId + 1,
    isGridFocused: true,
    rowIndex,
    rowKey,
  });
};
