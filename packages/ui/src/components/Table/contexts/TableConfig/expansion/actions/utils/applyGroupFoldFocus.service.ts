import type {
  TableColumn,
  TableFocusState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { moveTableFocusToRow } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils';

import { resolveGroupCollapseFocusTarget } from './resolveGroupCollapseFocusTarget.util';

type ApplyGroupFoldFocusArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly container: HTMLElement | null | undefined;
  readonly focusState: TableFocusState;
  readonly focusStore: TStore<TableFocusState>;
  readonly groupPathKey: string | undefined;
  readonly rowHeight: number;
  readonly rows: readonly TData[];
};

export const applyGroupFoldFocus = <TData extends Record<string, unknown>>({
  columns,
  container,
  focusState,
  focusStore,
  groupPathKey,
  rowHeight,
  rows,
}: ApplyGroupFoldFocusArgs<TData>) => {
  const target =
    groupPathKey === undefined
      ? undefined
      : resolveGroupCollapseFocusTarget({
          columns,
          focusedRowKey: focusState.rowKey,
          groupPathKey,
          rows,
        });

  if (target === undefined) return;

  moveTableFocusToRow({
    container,
    focusState,
    focusStore,
    rowHeight,
    ...target,
  });
};
