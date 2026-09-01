import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';

type BuildGroupingSetsClauseArgs = {
  readonly expressionByKey?: Readonly<Record<string, string>>;
  readonly sets: readonly (readonly string[])[];
};

export const buildGroupingSetsClause = ({
  expressionByKey = {},
  sets,
}: BuildGroupingSetsClauseArgs): string => {
  const rendered = sets.map(
    (set) =>
      `(${set.map((key) => expressionByKey[key] ?? quoteIdentifier(key)).join(', ')})`,
  );

  return `GROUP BY GROUPING SETS (${rendered.join(', ')})`;
};
