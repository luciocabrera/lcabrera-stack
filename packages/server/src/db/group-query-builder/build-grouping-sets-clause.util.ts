import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';

type BuildGroupingSetsClauseArgs = {
  /**
   * Each key's SQL, by key — `resolveGroupKeyExpression`, resolved once per
   * query. A key with no entry falls back to its quoted identifier, which is
   * what that resolver answers for an untruncated key anyway.
   */
  readonly expressionByKey?: Readonly<Record<string, string>>;
  /** Already expanded by `expandGroupingSets`, in emission order. */
  readonly sets: readonly (readonly string[])[];
};

/**
 * `GROUP BY GROUPING SETS ((a, b), (a), ())` — the one grouping construct this
 * module emits, per ADR-059. The empty set is the grand total and renders as
 * `()`, which is legal and load-bearing rather than a degenerate case.
 *
 * A key is rendered from `expressionByKey` rather than quoted here, so a
 * truncated key groups by the same expression `GROUPING()` and the projection
 * name it. Postgres matches those syntactically, so a second spelling would
 * fail to plan rather than answer differently (#786).
 */
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
