import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';

type BuildGroupingSetsClauseArgs = {
  /** Already expanded by `expandGroupingSets`, in emission order. */
  readonly sets: readonly (readonly string[])[];
};

/**
 * `GROUP BY GROUPING SETS ((a, b), (a), ())` — the one grouping construct this
 * module emits, per ADR-059. The empty set is the grand total and renders as
 * `()`, which is legal and load-bearing rather than a degenerate case.
 */
export const buildGroupingSetsClause = ({
  sets,
}: BuildGroupingSetsClauseArgs): string => {
  const rendered = sets.map(
    (set) => `(${set.map((key) => quoteIdentifier(key)).join(', ')})`,
  );

  return `GROUP BY GROUPING SETS (${rendered.join(', ')})`;
};
