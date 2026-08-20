import type {
  TableGroupAggregateValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

type ResolveShareDenominatorsArgs = {
  /** The columns a share was asked for. Nothing else is measured. */
  readonly shares: readonly string[];
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

const findAggregate = ({
  columnKey,
  summary,
}: {
  readonly columnKey: string;
  readonly summary: TableGroupRowSummary;
}) => summary.aggregates.find((entry) => entry.columnKey === columnKey);

/**
 * The flat-mode denominator: every leaf's value added up.
 *
 * `undefined` the moment any leaf is unreadable — whether its value cannot be
 * read **or** it carries no entry for this column at all. A total over the rows
 * that happened to have one is a denominator that silently omitted the rest,
 * which is the failure this whole util exists to avoid; skipping such a row
 * would produce a plausible percentage from a partial sum.
 *
 * A column **no** row carries reaches the same answer by the same branch, so
 * "nothing to measure" and "measured incompletely" are one refusal rather than
 * two behaviours to keep in step.
 */
const sumLeafAggregates = ({
  columnKey,
  summaries,
}: {
  readonly columnKey: string;
  readonly summaries: readonly TableGroupRowSummary[];
}) => {
  let total = 0;
  let isSawOne = false;

  for (const summary of summaries) {
    if (summary.isSubtotal) continue;

    const value = toFiniteNumber(findAggregate({ columnKey, summary })?.value);

    if (value === undefined) return;

    total += value;
    isSawOne = true;
  }

  return isSawOne ? total : undefined;
};

/**
 * The grand total a share divides by, per column.
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
 * A column with no usable denominator is **absent from the map** rather than
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

  for (const columnKey of shares) {
    const fromGrandTotal =
      grandTotal === undefined
        ? undefined
        : findAggregate({ columnKey, summary: grandTotal })?.value;

    const total =
      fromGrandTotal === undefined
        ? sumLeafAggregates({ columnKey, summaries })
        : toFiniteNumber(fromGrandTotal);

    if (total !== undefined && total !== 0) {
      denominators.set(columnKey, total);
    }
  }

  return denominators;
};
