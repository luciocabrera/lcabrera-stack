import type { BuiltQuery } from './query-builder.types.ts';

type BuildForeignKeyRelationsQueryArgs = {
  readonly depth: number;
  readonly schema: string;
  readonly table: string;
};

export const buildForeignKeyRelationsQuery = ({
  depth,
  schema,
  table,
}: BuildForeignKeyRelationsQueryArgs): BuiltQuery => ({
  text: `WITH RECURSIVE reachable (relid, depth) AS (
    SELECT c.oid, 0
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = $1 AND c.relname = $2
    UNION
    SELECT con.confrelid, r.depth + 1
      FROM reachable r
      JOIN pg_constraint con ON con.conrelid = r.relid AND con.contype = 'f'
     WHERE r.depth + 1 < $3
  )
SELECT sn.nspname AS "schema",
       sc.relname AS "table",
       ARRAY(SELECT a.attname::text
               FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
              ORDER BY k.ord) AS "columns",
       tn.nspname AS "referencedSchema",
       tc.relname AS "referencedTable",
       ARRAY(SELECT a.attname::text
               FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
              ORDER BY k.ord) AS "referencedColumns"
  FROM pg_constraint con
  JOIN pg_class sc ON sc.oid = con.conrelid
  JOIN pg_namespace sn ON sn.oid = sc.relnamespace
  JOIN pg_class tc ON tc.oid = con.confrelid
  JOIN pg_namespace tn ON tn.oid = tc.relnamespace
 WHERE con.contype = 'f'
   AND con.conrelid IN (SELECT relid FROM reachable)
 ORDER BY sn.nspname, sc.relname, con.conname`,
  values: [schema, table, depth],
});
