import type { ColumnType } from '../db/query-builder/query-builder.types.ts';

/** Why a filter-options request was refused, ahead of any SQL. */
export type FilterOptionsSourceRefusal = 'unknown-column' | 'unknown-source';

export type FilterOptionsSourceResolution =
  | {
      readonly allowed: false;
      readonly refusal: FilterOptionsSourceRefusal;
    }
  | {
      readonly allowed: true;
      /** Every column the source exposes — pass straight to `selectFilterOptions`. */
      readonly allowedColumns: readonly string[];
      readonly columnType: ColumnType;
    };

/**
 * `schema.table` → the columns that source exposes to a filter dropdown, each
 * with the `ColumnType` its values are read as. The key is the joined pair
 * because that is what a request carries; the map is the **authorization
 * boundary**, so it is developer-curated rather than derived from the catalogue.
 */
export type FilterOptionsSources = Readonly<
  Record<string, Readonly<Record<string, ColumnType>>>
>;

export type ResolveFilterOptionsSourceArgs = {
  readonly column: string;
  readonly schema: string;
  readonly sources: FilterOptionsSources;
  readonly table: string;
};

/**
 * Authorize a filter-options request against a source registry, before any SQL
 * is composed: is `schema.table` a source this endpoint serves, and is `column`
 * one it exposes?
 *
 * `selectFilterOptions` cannot answer either question. It allow-lists the
 * column it is given (`allowedColumns`) but takes `schema`/`table` as data, so a
 * caller that reads all three off a request has no package-side way to decide
 * *which tables may be asked at all* — and every consumer that serves a generic
 * `/distinct` endpoint has hand-rolled the same lookup. This is that lookup,
 * with the registry supplied by the caller: the columns and their types are the
 * consumer's data, the refusal rule is not.
 *
 * Returns a refusal rather than throwing, and distinguishes an unknown source
 * from an unknown column, because the two edges consuming it answer differently
 * — one maps the refusal to a 400 body, the other to a typed HTTP error — and
 * neither wants to catch. Do **not** put the refusal in the response: it tells a
 * caller which tables exist.
 */
export const resolveFilterOptionsSource = ({
  column,
  schema,
  sources,
  table,
}: ResolveFilterOptionsSourceArgs): FilterOptionsSourceResolution => {
  const sourceKey = `${schema}.${table}`;
  // Own properties only, on both lookups. A registry is an object literal, so a
  // request for the column `constructor` otherwise resolves to `Object`'s and
  // this returns `allowed` with a `columnType` that is a function.
  const columns = Object.hasOwn(sources, sourceKey)
    ? sources[sourceKey]
    : undefined;

  if (columns === undefined) {
    return { allowed: false, refusal: 'unknown-source' };
  }

  const columnType = Object.hasOwn(columns, column)
    ? columns[column]
    : undefined;

  if (columnType === undefined) {
    return { allowed: false, refusal: 'unknown-column' };
  }

  return { allowed: true, allowedColumns: Object.keys(columns), columnType };
};
