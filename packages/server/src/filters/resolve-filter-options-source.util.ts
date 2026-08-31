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

export type FilterOptionsSources = Readonly<
  Record<string, Readonly<Record<string, ColumnType>>>
>;

export type ResolveFilterOptionsSourceArgs = {
  readonly column: string;
  readonly schema: string;
  readonly sources: FilterOptionsSources;
  readonly table: string;
};

export const resolveFilterOptionsSource = ({
  column,
  schema,
  sources,
  table,
}: ResolveFilterOptionsSourceArgs): FilterOptionsSourceResolution => {
  const sourceKey = `${schema}.${table}`;
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
