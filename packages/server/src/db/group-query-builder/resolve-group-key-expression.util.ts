import type { GroupKeyPeriod } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import {
  GROUP_PERIOD_TIME_ZONE,
  PERIOD_SQL_FIELD,
} from './group-query-builder.constants.ts';

type ResolveGroupKeyExpressionArgs = {
  readonly key: string;
  readonly period?: GroupKeyPeriod;
  /** The column's Postgres type name — what decides which truncation form is emitted. */
  readonly typeName?: string;
};

/**
 * The SQL a group key is grouped by: the quoted column, or a truncation of it (#786).
 * One function because the same string has to appear in four places — the projection,
 * `GROUPING()`, the grouping sets, and the `ORDER BY`'s `GROUPING` terms — and Postgres
 * matches `GROUPING(x)` against a `GROUP BY` expression **syntactically**.
 */
export const resolveGroupKeyExpression = ({
  key,
  period,
  typeName,
}: ResolveGroupKeyExpressionArgs): string => {
  const quoted = quoteIdentifier(key);

  if (period === undefined) return quoted;

  const field = PERIOD_SQL_FIELD[period];

  if (field === undefined) {
    throw new Error(
      `Unknown group-key granularity "${String(period)}" for column "${key}".`,
    );
  }

  return typeName === 'timestamptz'
    ? `date_trunc('${field}', ${quoted}, '${GROUP_PERIOD_TIME_ZONE}')`
    : `date_trunc('${field}', ${quoted}::timestamp)`;
};
