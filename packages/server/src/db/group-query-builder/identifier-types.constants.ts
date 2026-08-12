/**
 * Types admitted as dimensions by **name** rather than by `typcategory`, and the
 * only place ADR-058's Gate 1 is not a derivation.
 *
 * `uuid` needs this because Postgres files it under category `U` beside `jsonb`,
 * `xml`, `bytea` and `tsvector` — types the Table cannot render — so no
 * structural property of a catalogue row separates it from them. A `uuid` row
 * and a `jsonb` row report the same category, the same equality answer and the
 * same `{count}` aggregate set; only the name differs.
 *
 * Entries are **schema-qualified**, and that is not decoration: type names are
 * per-schema, so `CREATE TYPE app.uuid AS (…)` yields a composite whose
 * `typname` is `uuid`. Matching on the bare name would admit it as a dimension —
 * a type the Table cannot render, which is the exact failure this gate exists to
 * prevent.
 *
 * Being an identifier also carries a second rule: these types must demonstrate
 * low cardinality before they are a legal group key, the same bar a fact clears,
 * because a `uuid` column is far more often a key than a label. That is why
 * `refuse-group-key.util.ts` consults `isIdentifierType` too rather than
 * treating them as ordinary dimensions.
 *
 * Keep it small. Every entry is a type someone has to maintain by hand, which is
 * the cost the category derivation exists to avoid.
 */
export const IDENTIFIER_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.uuid',
]);
