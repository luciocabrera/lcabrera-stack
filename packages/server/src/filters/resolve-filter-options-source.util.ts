import type { ColumnType } from '../db/query-builder/query-builder.types.ts';

export type FilterOptionsSourceRefusal = 'unknown-column' | 'unknown-source';

export type FilterOptionsSourceResolution =
  | {
      readonly allowed: false;
      readonly refusal: FilterOptionsSourceRefusal;
    }
  | {
      readonly allowed: true;
      readonly allowedColumns: readonly string[];
      readonly columnType: ColumnType;
    };

/**
 * The key is the joined pair because that is what a request carries; the map is the
 * **authorization boundary**, so it is developer-curated rather than derived from the
 * catalogue.
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

/** `selectFilterOptions` cannot answer either question. */
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
