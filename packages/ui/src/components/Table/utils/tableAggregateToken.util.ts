import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { isTableAggregateFn } from './isTableAggregateFn.util';

const SEPARATOR = ':';

export const toTableAggregateToken = ({
  columnKey,
  fn,
}: TableColumnAggregate) => `${columnKey}${SEPARATOR}${fn}`;

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
