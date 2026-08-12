import type { ColumnAnalyticalRole } from './group-query-builder.types.ts';

import { isIdentifierType } from './is-identifier-type.util.ts';

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

type ResolveAnalyticalRoleArgs = {
  readonly typeCategory: string;
  readonly typeName: string;
  readonly typeNamespace: string;
};

/**
 * Gate 1 of ADR-058, from the column's real Postgres type. `jsonb` (`U`),
 * `point` (`G`) and arrays (`A`) are deliberately absent — the Table cannot
 * render them, and a type it cannot display is not one it can group.
 *
 * The identifier check runs **before** the category (#599). Category `U` cannot
 * be admitted: it holds `uuid` alongside `jsonb`, `xml` and `bytea`, and a
 * `uuid` row is identical to a `jsonb` one on every structural field a catalogue
 * row carries. So `uuid` is named, `U` stays out, and adding the category here
 * to reach a uuid is the mistake the tests guard.
 */
export const resolveAnalyticalRole = ({
  typeCategory,
  typeName,
  typeNamespace,
}: ResolveAnalyticalRoleArgs): ColumnAnalyticalRole =>
  isIdentifierType({ typeName, typeNamespace })
    ? 'dimension'
    : (ROLE_BY_TYPE_CATEGORY[typeCategory] ?? 'unsupported');
