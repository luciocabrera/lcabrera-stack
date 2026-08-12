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
  I: 'dimension', // inet and cidr — the category holds nothing else
  N: 'fact', // numeric, including money
  S: 'dimension', // string
  T: 'fact', // interval — sole member; `sum`/`avg` are what a duration wants
};

/**
 * Gate 1 of ADR-058, from the column's real Postgres type category. `jsonb`
 * (`U`), `point` (`G`) and arrays (`A`) are deliberately absent — the Table
 * cannot render them, and a type it cannot display is not one it can group.
 *
 * `U` stays absent even though `uuid` lives there and is perfectly displayable:
 * the category also holds `jsonb`, `xml`, `bytea` and `tsvector`, and a `uuid`
 * column is indistinguishable from a `jsonb` one on every field the capability
 * query returns — same category, same equality answer, same `{count}` aggregate
 * set. Admitting it means naming the type, which is a decision rather than a
 * derivation — tracked as #599, not an oversight to fix by adding `U` here.
 */
export const resolveAnalyticalRole = (
  typeCategory: string,
): ColumnAnalyticalRole => ROLE_BY_TYPE_CATEGORY[typeCategory] ?? 'unsupported';
