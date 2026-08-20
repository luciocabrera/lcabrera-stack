import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { isShareableAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { isWithinCountDistinctBudget } from '#ui/components/Table/utils/countDistinctBudget.util';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type SanitizeGroupingByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly grouping: TableGroupingState;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

/**
 * Narrows a URL-supplied grouping configuration to what this route's columns
 * actually allow, and refuses the **whole** configuration rather than dropping
 * part of it.
 *
 * Whole-state refusal is the contract (ADR-061), and grouping is where it earns
 * its keep: keys are ordered, and the order is the query's nesting order, so
 * dropping one silently answers a different question from the one the URL
 * describes. `sanitizeFiltersByColumns` drops per entry because a filter list is
 * a conjunction where each term stands alone; a key list is not. An aggregate
 * dropped on its own would mislead the same way — the numbers a shared link
 * promised would simply be absent from the table it opened.
 *
 * A duplicate key is refused for the same reason, and so is a list longer than
 * `MAX_TABLE_GROUP_KEYS`: the server refuses both too, and turning a 400 into a
 * flat table beats turning it into a 500.
 *
 * The **mode** passes through untouched. Which grouping sets a read emits is a
 * property of the query rather than of any column, so no column declaration can
 * refuse one — the closed vocabulary is enforced by the codec before this, and
 * the server refuses a mode its builder has no expansion for after it.
 *
 * `resolveColumnCapabilities` is the only column predicate here: a column keyed
 * `actions` is refused because `createActionsColumn` declares it ungroupable,
 * not because this function knows about that key. An aggregate's column is
 * checked for **existence** only — whether a given function is legal for it is a
 * catalogue answer (ADR-058) that no client-side column declaration can supply,
 * and the server's `assertGroupAggregates` is what enforces that half.
 *
 * What this side *can* see about the aggregate list is that no `(columnKey, fn)`
 * pair repeats, and it refuses a repeat whole for the reason it refuses a
 * duplicate key (#831).
 *
 * It can see one thing more, and it is not a per-column question at all: how
 * many `countDistinct` aggregates the list carries between them. The read takes
 * `MAX_TABLE_COUNT_DISTINCT_AGGREGATES` of them, so a link naming two is refused
 * here rather than sent and refused by `assertGroupAggregates` (#842). Whole,
 * like the rest: which of the two to keep is a question the link never answered,
 * and a table quietly showing one of them is not the table the link promised.
 *
 * A **granularity** splits along the same seam (#786). That it names one of the
 * keys is structural, so it is refused here; that the column is a date at all,
 * and that this granularity clears the cardinality guard, are catalogue answers,
 * so `assertGroupKeys` refuses those. Checking only the half this side can see
 * is what keeps a link naming an impossible granularity from turning into a
 * silently different table rather than a stated refusal.
 */
export const sanitizeGroupingByColumns = <
  TData extends Record<string, unknown>,
>({
  columns,
  grouping,
}: SanitizeGroupingByColumnsArgs<TData>): TableGroupingState => {
  const { aggregates, keys, mode, periods, shares } = grouping;

  if (keys.length === 0 || keys.length > MAX_TABLE_GROUP_KEYS) {
    return NO_GROUPING;
  }

  const groupableKeys = new Set(
    columns
      .filter((column) => resolveColumnCapabilities(column).isGroupable)
      .map((column) => String(column.key)),
  );
  const declaredKeys = new Set(columns.map((column) => String(column.key)));

  const isEveryKeyGroupable = keys.every((key) => groupableKeys.has(key));
  const areKeysDistinct = new Set(keys).size === keys.length;
  const isEveryAggregateColumnDeclared = aggregates.every(({ columnKey }) =>
    declaredKeys.has(columnKey),
  );
  const appliedAggregates = new Set(
    aggregates.map((entry) => toTableAggregateToken(entry)),
  );
  // Refused for the reason a duplicate **key** is: the pair is an aggregate's
  // identity, so a repeated one gives the staged list two rows nothing can tell
  // apart and a share no way to say which of them it belongs to (#831).
  const areAggregatesDistinct = appliedAggregates.size === aggregates.length;
  const isCountDistinctAffordable = isWithinCountDistinctBudget(aggregates);
  const appliedKeys = new Set(keys);
  const isEveryGranularityOnAKey = Object.keys(periods).every((column) =>
    appliedKeys.has(column),
  );
  // A share divides a measure by a total the client derives, and only an
  // additive measure has one it can derive correctly — so a share on any other
  // aggregate is not a rounding difference but a wrong number that still sums
  // to 100% (#648). It must also name an aggregate this configuration actually
  // applies, since a share of a measure nobody asked for divides nothing.
  // Refused with the rest rather than dropped, because a link promising a
  // percentage that silently does not appear is the failure ADR-061 refuses
  // whole configurations to avoid.
  const isEveryShareOnAShareableAggregate = shares.every(
    (share) =>
      isShareableAggregate(share.fn) &&
      appliedAggregates.has(toTableAggregateToken(share)),
  );
  // Refused for the same reason a duplicate aggregate is, and with a
  // consequence of its own: every reader downstream treats the shares as a set,
  // so a repeated entry makes `resolveTableGroupingUpdate` compare a length
  // against a set's size and report a change where there is none — a navigation
  // per click on a control that changed nothing (#648).
  const areSharesDistinct =
    new Set(shares.map((entry) => toTableAggregateToken(entry))).size ===
    shares.length;

  return isEveryKeyGroupable &&
    areKeysDistinct &&
    isEveryAggregateColumnDeclared &&
    areAggregatesDistinct &&
    isCountDistinctAffordable &&
    isEveryGranularityOnAKey &&
    isEveryShareOnAShareableAggregate &&
    areSharesDistinct
    ? {
        aggregates: [...aggregates],
        keys: [...keys],
        mode,
        periods: { ...periods },
        shares: [...shares],
      }
    : NO_GROUPING;
};
