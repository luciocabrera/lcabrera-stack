import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { withGroupDrill } from './utils';

const NO_ROWS: readonly Record<string, unknown>[] = [];

/**
 * Fetches one group's rows and records what happened (ADR-079).
 *
 * **It writes `loading` before awaiting, and that write is what makes the drill
 * idempotent.** `resolveDrilledRows` renders a row for any entry, so the group
 * is visibly busy from the first frame; and because the entry now exists, a
 * second toggle while the request is in flight sees it and does not fire
 * another. There is no in-flight ref — the state a user can see is the same
 * state the guard reads.
 *
 * **A rejection becomes `failed`, never an empty page.** `loaded` with no rows
 * contradicts the count printed beside it on the group row, and a return to no
 * entry at all reads as "the click did nothing" — so the user's next move is to
 * click again, which is the same failing request (ADR-079, amended). `failed`
 * is not terminal: toggling the group retries, which is the one deliberate
 * gesture that leaves the state.
 *
 * The reason is discarded. A refusal and a timeout differ to the route and not
 * to the reader of one row, and a per-cause state was declined explicitly.
 */
export const useDrillTableGroup = <TData extends Record<string, unknown>>() => {
  const { expansionStore, groupingStore, onDrillGroup } =
    useTableConfigContextValue<TData>();

  return async (path: readonly TableGroupKeyValue[]) => {
    if (onDrillGroup === undefined) return;

    const pathKey = resolveGroupPathKey(path);

    expansionStore.set({
      drilledGroups: withGroupDrill({
        drill: { rows: NO_ROWS, status: 'loading' },
        drilledGroups: expansionStore.get().drilledGroups,
        pathKey,
      }),
    });

    try {
      const rows = await onDrillGroup({
        groupingKeys: groupingStore.get().keys,
        path,
      });

      expansionStore.set({
        drilledGroups: withGroupDrill({
          drill: { rows, status: 'loaded' },
          drilledGroups: expansionStore.get().drilledGroups,
          pathKey,
        }),
      });
    } catch {
      expansionStore.set({
        drilledGroups: withGroupDrill({
          drill: { rows: NO_ROWS, status: 'failed' },
          drilledGroups: expansionStore.get().drilledGroups,
          pathKey,
        }),
      });
    }
  };
};
