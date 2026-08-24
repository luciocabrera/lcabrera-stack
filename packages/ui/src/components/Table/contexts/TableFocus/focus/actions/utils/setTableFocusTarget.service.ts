import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

type SetTableFocusTargetArgs = {
  readonly columnKey: string;
  readonly focusStore: TStore<TableFocusState>;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * The one place `focusRequestId` is incremented, so a request can never be raised without
 * the target it refers to, nor a target set without a request that would apply it.
 */
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
