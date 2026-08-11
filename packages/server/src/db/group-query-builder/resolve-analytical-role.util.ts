import type { ColumnAnalyticalRole } from './group-query-builder.types.ts';

/**
 * `pg_type.typcategory` codes that carry an analytical role. The mapping is a
 * derivation rather than a hand-kept type list, which is the point: `citext`,
 * a domain over `text` and a future string type all arrive as `S` without
 * anyone maintaining an entry, and everything unrecognised falls through to
 * `unsupported` (ADR-058 Gate 1 — an unknown type is refused by default).
 */
const ROLE_BY_TYPE_CATEGORY: Readonly<Record<string, ColumnAnalyticalRole>> = {
  B: 'dimension', // boolean
  D: 'dimension', // date/time
  E: 'dimension', // enum
  N: 'fact', // numeric, including money
  S: 'dimension', // string
};

/**
 * Gate 1 of ADR-058, from the column's real Postgres type category. `jsonb`
 * (`U`), `point` (`G`) and arrays (`A`) are deliberately absent — the Table
 * cannot render them, and a type it cannot display is not one it can group.
 */
export const resolveAnalyticalRole = (
  typeCategory: string,
): ColumnAnalyticalRole => ROLE_BY_TYPE_CATEGORY[typeCategory] ?? 'unsupported';
