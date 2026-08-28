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
  /** The snapshot the calling action already read — never a second `store.get()`. */
  readonly focusState: TableFocusState;
  readonly focusStore: TStore<TableFocusState>;
  /** The group this fold closed around the focused row, or `undefined` if it closed none. */
  readonly groupPathKey: string | undefined;
  readonly rowHeight: number;
  /** The rows the fold leaves standing — the list the surviving ancestor is looked up in. */
  readonly rows: readonly TData[];
};

/**
 * The tail every fold shares: hand focus to the row a collapse left standing, or leave it
 * alone because the row holding it is still drawn.
 * Doing nothing is the ordinary outcome rather than an error — a fold whose focused row
 * survived names no group and resolves no target — so all three fold actions call this
 * unconditionally instead of each guarding first, which is how the guard came to be
 * written three times over.
 */
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
