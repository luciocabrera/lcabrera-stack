import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { isTableAggregateFn } from './isTableAggregateFn.util';

const SEPARATOR = ':';

/**
 * A column may carry several aggregates, so neither half identifies an entry on its own —
 * and three unrelated places need one string rather than a pair: the `grouping` param's
 * `agg` and `share` members, the key of the share denominator map, and the React key of a
 * staged aggregate row.
 * **The encoder and the parser live together on purpose** (ADR-082): the right-split rule
 * below is the only thing that makes this format total, and split across modules the two
 * can disagree in any way at all and still compile.
 */
export const toTableAggregateToken = ({
  columnKey,
  fn,
}: TableColumnAggregate) => `${columnKey}${SEPARATOR}${fn}`;

/**
 * A naive `split(':')` gets every ordinary key right and silently mangles that one.
 * This is a deliberate departure from `resolveGroupPathKey`, which encodes a group path
 * with `JSON.stringify` because *"a label may contain any character, and a joined form
 * collides the moment one contains the delimiter"*.
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
 * All-or-nothing rather than per entry, so the caller cannot accidentally accept a
 * partly-read list — the refuse-whole rule the `grouping` param is read under (ADR-061).
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
