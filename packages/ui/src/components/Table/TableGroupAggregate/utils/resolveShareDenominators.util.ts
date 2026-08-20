import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableGroupAggregateValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ResolveShareDenominatorsArgs = {
  /** The measures a share was asked for. Nothing else is measured. */
  readonly shares: readonly TableColumnAggregate[];
  readonly summaries: readonly TableGroupRowSummary[];
};

/**
 * A raw aggregate as a number, or `undefined` when it is not one.
 *
 * A `numeric` or `bigint` aggregate arrives from `pg` as a **string**, kept as
 * one because neither survives a JS number losslessly. Converting is safe
 * *here* and only here: the result is one operand of a ratio rendered to a
 * decimal place, so the ~15 significant digits a double carries are far more
 * than the answer shows. The value the cell *displays* is still the string —
 * this conversion never reaches it (#648).
 */
const toFiniteNumber = (value: TableGroupAggregateValue['value']) => {
  const parsed = typeof value === 'string' ? Number(value) : value;

  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

/**
 * The row's entry for one measure, matched on the `(columnKey, fn)` pair.
 *
 * The function is part of the match, not decoration: a column may carry both
 * `sum` and `count`, and taking whichever entry came first would divide one
 * measure by the other's total (#831).
 */
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
 *
 * `undefined` the moment any leaf is unreadable — whether its value cannot be
 * read **or** it carries no entry for this measure at all. A total over the rows
 * that happened to have one is a denominator that silently omitted the rest,
 * which is the failure this whole util exists to avoid; skipping such a row
 * would produce a plausible percentage from a partial sum.
 *
 * A measure **no** row carries reaches the same answer by the same branch, so
 * "nothing to measure" and "measured incompletely" are one refusal rather than
 * two behaviours to keep in step.
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
 * The grand total a share divides by, per **measure** — keyed by the
 * `(columnKey, fn)` token, since a column may carry two shareable aggregates
 * and each has its own total (#831).
 *
 * **Two sources, and both are exact for the measures a share is offered on.**
 * Under `rollup` the read already emitted the grand total as a row — keyed by
 * nothing, `isSubtotal` and an empty `path` — and that row is preferred because
 * Postgres computed it over the whole set. Under `flat` no such row exists, so
 * the leaves are summed instead, which is exact because a share is only offered
 * on additive measures (`TABLE_SHAREABLE_AGGREGATE_FNS`) and a flat grouping's
 * single grouping set partitions the rows.
 *
 * Summing **non-subtotal** rows matters under the fallback: a rollup result
 * interleaves subtotals with the leaves they total, so counting them would
 * multiply the denominator by the depth of the tree.
 *
 * A measure with no usable denominator is **absent from the map** rather than
 * present as zero. Division is the caller's job and the caller renders an
 * explicit absence for a missing entry — `0` would divide to `Infinity` and
 * render as a number nobody computed (#648).
 *
 * **Deriving this client-side is sound only while a grouped read is whole**
 * (`hasMore: false`, ADR-059), and this function cannot check that: it sees the
 * summaries it is handed and no indication of whether they are all of them. Fed
 * a partial page it computes a denominator from the rows present and returns a
 * plausible wrong number — no absence, no warning. If a grouped read ever gains
 * pagination, the share has to be reconsidered here rather than expected to
 * fail loudly (ADR-086).
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
