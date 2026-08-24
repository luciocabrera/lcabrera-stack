import type { BuiltQuery } from '../query-builder/query-builder.types.ts';
import type { ColumnCapabilitiesQueryDescriptor } from './group-query-builder.types.ts';

import {
  AGGREGATE_SQL_NAMES,
  PERIOD_CAPABLE_TYPE_NAMES,
} from './group-query-builder.constants.ts';

/**
 * Bare type names: `bt.typname` carries no schema, so this over-selects
 * `app.date` and the gate refuses it. Over-selecting is the safe direction.
 */
const PERIOD_CAPABLE_TYPE_SQL_NAMES = [
  ...new Set(
    [...PERIOD_CAPABLE_TYPE_NAMES].map(
      (name) => name.split('.').at(-1) ?? name,
    ),
  ),
].toSorted((a, b) => a.localeCompare(b));

/**
 * Bound parameters only — no identifier interpolation (ADR-058).
 * `spanDays` is measured in the truncation's frame: casting `date` to `timestamptz`
 * under-counts across DST, which is the wrong direction for an upper bound.
 * `extract(epoch)` is `numeric` (a string from `pg`); `::float8` keeps the arithmetic
 * numeric.
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
       c.reltuples AS "relTuples",
       CASE
         WHEN bt.typname = 'timestamptz'
           THEN (SELECT (extract(epoch FROM (max(b::timestamptz) - min(b::timestamptz))) / 86400)::float8
                   FROM unnest(s.histogram_bounds::text::text[]) AS b)
         WHEN bt.typname = ANY($5::text[])
           THEN (SELECT (extract(epoch FROM (max(b::timestamp) - min(b::timestamp))) / 86400)::float8
                   FROM unnest(s.histogram_bounds::text::text[]) AS b)
       END AS "spanDays"
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
  values: [
    schema,
    table,
    columns,
    AGGREGATE_SQL_NAMES,
    PERIOD_CAPABLE_TYPE_SQL_NAMES,
  ],
});
