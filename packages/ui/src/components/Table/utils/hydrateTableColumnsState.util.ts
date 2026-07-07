import type {
  TableColumn,
  TableColumnsStateInput,
} from '@repo/ui/components/Table/Table.types';

const ACTIONS_COLUMN_KEY = 'actions';

type HydrateTableColumnsStateArgs<TData extends Record<string, unknown>> = {
  /** Full client-side column definitions (render/filter callbacks included) */
  readonly columns: TableColumn<TData>[];
  /** Serializable columns state slice as it crossed the server/client boundary */
  readonly columnsState: TableColumnsStateInput<TData>;
};

/**
 * Rehydrates a loader-seeded, serializable columns state slice with the full
 * client-side column definitions (function-bearing fields like `render` and
 * async filter callbacks are dropped across SSR hydration and must be
 * restored from the route's own column constants).
 *
 * Also normalizes pinning so an `actions` column always stays pinned on the
 * right, regardless of what the (possibly stale/persisted) loader state says.
 */
export const hydrateTableColumnsState = <
  TData extends Record<string, unknown>,
>({
  columns,
  columnsState,
}: HydrateTableColumnsStateArgs<TData>): TableColumnsStateInput<TData> => {
  const pinnedLeft = columnsState.columnPinning.left.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );
  const pinnedRight = columnsState.columnPinning.right.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );

  return {
    ...columnsState,
    columnPinning: {
      left: pinnedLeft,
      right: [...pinnedRight, ACTIONS_COLUMN_KEY],
    },
    columns,
  };
};
