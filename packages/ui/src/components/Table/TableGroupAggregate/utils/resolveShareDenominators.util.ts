import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableGroupAggregateValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ResolveShareDenominatorsArgs = {
  readonly shares: readonly TableColumnAggregate[];
  readonly summaries: readonly TableGroupRowSummary[];
};

/**
 * The value the cell *displays* is still the string — this conversion never reaches it
 * (#648).
 */
const toFiniteNumber = (value: TableGroupAggregateValue['value']) => {
  const parsed = typeof value === 'string' ? Number(value) : value;

  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const findAggregate = ({
  columnKey,
  fn,
  summary,
}: {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly summary: TableGroupRowSummary;
}) =>
  summary.aggregates.find(
    (entry) => entry.columnKey === columnKey && entry.fn === fn,
  );

/**
 * The flat-mode denominator: every leaf's value added up.
 * `undefined` the moment any leaf is unreadable — whether its value cannot be read **or**
 * it carries no entry for this measure at all.
 */
const sumLeafAggregates = ({
  columnKey,
  fn,
  summaries,
}: {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly summaries: readonly TableGroupRowSummary[];
}) => {
  let total = 0;
  let hasSeenLeaf = false;

  for (const summary of summaries) {
    if (summary.isSubtotal) continue;

    const value = toFiniteNumber(
      findAggregate({ columnKey, fn, summary })?.value,
    );

    if (value === undefined) return;

    total += value;
    hasSeenLeaf = true;
  }

  return hasSeenLeaf ? total : undefined;
};

/**
 * The grand total a share divides by, per **measure** — keyed by the `(columnKey, fn)`
 * token, since a column may carry two shareable aggregates and each has its own total
 * (#831).
 * **Two sources, and both are exact for the measures a share is offered on.** Under
 * `rollup` the read already emitted the grand total as a row — keyed by nothing,
 * `isSubtotal` and an empty `path` — and that row is preferred because Postgres computed
 * it over the whole set.
 */
export const resolveShareDenominators = ({
  shares,
  summaries,
}: ResolveShareDenominatorsArgs): ReadonlyMap<string, number> => {
  const denominators = new Map<string, number>();

  if (shares.length === 0) return denominators;

  const grandTotal = summaries.find(
    (summary) => summary.isSubtotal && summary.path.length === 0,
  );

  for (const share of shares) {
    const { columnKey, fn } = share;
    const fromGrandTotal =
      grandTotal === undefined
        ? undefined
        : findAggregate({ columnKey, fn, summary: grandTotal })?.value;

    const total =
      fromGrandTotal === undefined
        ? sumLeafAggregates({ columnKey, fn, summaries })
        : toFiniteNumber(fromGrandTotal);

    if (total !== undefined && total !== 0) {
      denominators.set(toTableAggregateToken(share), total);
    }
  }

  return denominators;
};
