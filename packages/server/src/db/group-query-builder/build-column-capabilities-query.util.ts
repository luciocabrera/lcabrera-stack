import type { BuiltQuery } from '../query-builder/query-builder.types.ts';
import type { ColumnCapabilitiesQueryDescriptor } from './group-query-builder.types.ts';

import { AGGREGATE_SQL_NAMES } from './aggregate-sql.constants.ts';

/**
 * Gate 2 of ADR-058, plus the statistics the group-key rules need, in one
 * round trip. Schema, table, the column list and the probed aggregate names are
 * all bound parameters, so this query has **no identifier-interpolation
 * surface** — nothing a caller supplies is ever concatenated into the text.
 *
 * Three joins carry the whole answer, and each one exists for a reason a
 * simpler query gets wrong:
 *
 * - `bt` resolves a domain to its base type, so a domain over `text` is a
 *   string rather than an unknown.
 * - `tn` carries the **type's** schema, which the named identifier exception
 *   needs: type names are per-schema, so a user-defined `app.uuid` reports
 *   `typname = 'uuid'` exactly like the built-in does.
 * - the equality check follows `GetDefaultOpClass`: an exact `opcintype` match
 *   **or** a binary-coercible one. Without the second arm every `varchar`
 *   column is refused, because `varchar` has no opclass of its own and borrows
 *   `text`'s.
 * - the aggregate probe expands pseudo-typed variants precisely
 *   (`count(any)` is universal; `min(anyarray)`/`min(anyenum)` are not), so a
 *   `boolean` column is not offered the `min`/`max` Postgres has no aggregate
 *   for.
 *
 * `s.inherited = false` avoids double rows on a partition parent, and `pg_stats`
 * is permission-filtered, so a column the role cannot see falls into
 * "statistics unavailable" naturally rather than leaking its existence.
 */
export const buildColumnCapabilitiesQuery = ({
  columns,
  schema,
  table,
}: ColumnCapabilitiesQueryDescriptor): BuiltQuery => ({
  text: `SELECT a.attname AS "column",
       bt.typname AS "typeName",
       tn.nspname AS "typeNamespace",
       bt.typcategory AS "typeCategory",
       EXISTS (
         SELECT 1 FROM pg_opclass o
           JOIN pg_am m ON m.oid = o.opcmethod
           JOIN pg_type ot ON ot.oid = o.opcintype
          WHERE o.opcdefault AND m.amname IN ('btree', 'hash')
            AND (ot.oid = bt.oid
                 OR (ot.typname = 'anyarray' AND bt.typcategory = 'A')
                 OR (ot.typname = 'anyenum' AND bt.typtype = 'e')
                 OR EXISTS (SELECT 1 FROM pg_cast cs
                             WHERE cs.castsource = bt.oid
                               AND cs.casttarget = ot.oid
                               AND cs.castmethod = 'b'))
       ) AS "hasEquality",
       (SELECT coalesce(array_agg(DISTINCT p.proname), '{}')
          FROM pg_proc p
          JOIN pg_aggregate ag ON ag.aggfnoid = p.oid
          JOIN pg_type pt ON pt.oid = p.proargtypes[0]
         WHERE p.proname = ANY($4::text[])
           AND p.pronargs = 1
           AND (pt.oid = bt.oid
                OR pt.typname IN ('any', 'anyelement')
                OR (pt.typname = 'anyarray' AND bt.typcategory = 'A')
                OR (pt.typname = 'anyenum' AND bt.typtype = 'e')
                OR (pt.typname = 'anynonarray' AND bt.typcategory <> 'A')
                OR EXISTS (SELECT 1 FROM pg_cast cs
                            WHERE cs.castsource = bt.oid
                              AND cs.casttarget = pt.oid
                              AND cs.castmethod = 'b'))
       ) AS aggregates,
       (s.attname IS NOT NULL) AS "hasStats",
       coalesce(s.n_distinct, 0) AS "nDistinct",
       c.reltuples AS "relTuples"
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  JOIN pg_type bt ON bt.oid = coalesce(nullif(t.typbasetype, 0), t.oid)
  JOIN pg_namespace tn ON tn.oid = bt.typnamespace
  LEFT JOIN pg_stats s ON s.schemaname = n.nspname
                      AND s.tablename = c.relname
                      AND s.inherited = false
                      AND s.attname = a.attname
 WHERE n.nspname = $1 AND c.relname = $2
   AND a.attname = ANY($3::text[])
   AND a.attnum > 0 AND NOT a.attisdropped
 ORDER BY a.attnum`,
  values: [schema, table, columns, AGGREGATE_SQL_NAMES],
});
