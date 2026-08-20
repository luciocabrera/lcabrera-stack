import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { isTableAggregateFn } from './isTableAggregateFn.util';

/** The one character that separates a column key from its function. */
const SEPARATOR = ':';

/**
 * One applied aggregate as a single string: `"total_amount:sum"`.
 *
 * A column may carry several aggregates, so neither half identifies an entry on
 * its own — and three unrelated places need one string rather than a pair: the
 * `grouping` param's `agg` and `share` members, the key of the share
 * denominator map, and the React key of a staged aggregate row. One spelling
 * serves all three, because two spellings of the same identity drift the first
 * time either gains a character.
 *
 * **The encoder and the parser live together on purpose** (ADR-082): the
 * right-split rule below is the only thing that makes this format total, and
 * split across modules the two can disagree in any way at all and still
 * compile.
 */
export const toTableAggregateToken = ({
  columnKey,
  fn,
}: TableColumnAggregate) => `${columnKey}${SEPARATOR}${fn}`;

/**
 * The inverse — or `undefined` when the token is not one this vocabulary can
 * read.
 *
 * **Split on the LAST separator, not the first.** A column key is a consumer's
 * identifier and this package is published, so one may legitimately contain a
 * `:`. Splitting from the right is total because the function vocabulary is
 * closed and contains no `:`, so `"odd:col:sum"` reads as `("odd:col", "sum")`
 * and nothing else. A naive `split(':')` gets every ordinary key right and
 * silently mangles that one.
 *
 * This is a deliberate departure from `resolveGroupPathKey`, which encodes a
 * group path with `JSON.stringify` because *"a label may contain any character,
 * and a joined form collides the moment one contains the delimiter"*. That
 * reasoning holds for labels — arbitrary values, several per tuple — and not
 * here, where one side is a closed vocabulary and there is exactly one
 * delimiter.
 *
 * An empty column key is refused: it names no column, and admitting it would
 * put an entry in the store that no surface can render or remove.
 */
export const parseTableAggregateToken = (
  token: string,
): TableColumnAggregate | undefined => {
  const separatorIndex = token.lastIndexOf(SEPARATOR);

  if (separatorIndex <= 0) {
    return;
  }

  const columnKey = token.slice(0, separatorIndex);
  const fn = token.slice(separatorIndex + 1);

  return isTableAggregateFn(fn) ? { columnKey, fn } : undefined;
};

/**
 * Every token of a list, or `undefined` when **any** of them is unreadable.
 *
 * All-or-nothing rather than per entry, so the caller cannot accidentally
 * accept a partly-read list — the refuse-whole rule the `grouping` param is
 * read under (ADR-061).
 */
export const parseTableAggregateTokens = (
  tokens: readonly string[],
): readonly TableColumnAggregate[] | undefined => {
  const parsed: TableColumnAggregate[] = [];

  for (const token of tokens) {
    const aggregate = parseTableAggregateToken(token);

    if (aggregate === undefined) return;

    parsed.push(aggregate);
  }

  return parsed;
};
