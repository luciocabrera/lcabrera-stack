import type { GroupKeyPeriod } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import {
  GROUP_PERIOD_TIME_ZONE,
  PERIOD_SQL_FIELD,
} from './group-query-builder.constants.ts';

type ResolveGroupKeyExpressionArgs = {
  readonly key: string;
  readonly period?: GroupKeyPeriod;
  readonly typeName?: string;
};

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
