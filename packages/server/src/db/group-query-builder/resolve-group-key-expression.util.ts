import type { GroupKeyPeriod } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import {
  GROUP_PERIOD_TIME_ZONE,
  PERIOD_SQL_FIELD,
} from './group-query-builder.constants.ts';

type ResolveGroupKeyExpressionArgs = {
  readonly key: string;
  /** Absent for an ordinary key, which is then just the quoted column. */
  readonly period?: GroupKeyPeriod;
  /** The column's Postgres type name — what decides which truncation form is emitted. */
  readonly typeName?: string;
};

/**
 * The SQL a group key is grouped by: the quoted column, or a truncation of it
 * (#786).
 *
 * One function because the same string has to appear in four places — the
 * projection, `GROUPING()`, the grouping sets, and the `ORDER BY`'s `GROUPING`
 * terms — and Postgres matches `GROUPING(x)` against a `GROUP BY` expression
 * **syntactically**. Two spellings of the same truncation are two expressions,
 * and the query fails to plan rather than producing a wrong answer, so the
 * duplication is not the kind that rots quietly. Deriving it once removes the
 * question.
 *
 * **Neither truncation is the two-argument form on a bare column, and that is
 * the timezone decision.** `date_trunc(field, timestamptz)` resolves against the
 * session `TimeZone`, so the same order falls in December for one caller and
 * January for another — measured, not assumed: under `America/New_York` a
 * February order truncates to January. `timestamptz` therefore takes the
 * three-argument form pinned to `GROUP_PERIOD_TIME_ZONE`. A `date` or
 * `timestamp` has no zone, but the two-argument call would *promote* it to
 * `timestamptz` through the session zone and hand back a value whose rendering
 * moves with the reader; casting to `timestamp` keeps the whole expression
 * zone-free.
 *
 * The field name comes from a closed map rather than from the argument, so a
 * period that escaped validation cannot be interpolated — it throws here
 * instead, which is the last gate rather than the first.
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
