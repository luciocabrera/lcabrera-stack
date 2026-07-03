import type { DetailsRow } from '../DetailsSection.types';

type BuildIdentityRowsArgs = {
  readonly schemaName?: string;
  readonly tableName?: string;
  readonly title?: string;
};

/**
 * Build the optional identity rows, omitting any undefined values.
 * @param args - Title, table name, and schema name.
 * @returns The identity detail rows that have a value.
 */
export const buildIdentityRows = ({
  schemaName,
  tableName,
  title,
}: BuildIdentityRowsArgs): readonly DetailsRow[] => {
  const candidates: readonly (DetailsRow | undefined)[] = [
    title ? { key: 'title', label: 'Title', value: title } : undefined,
    tableName
      ? { key: 'table-name', label: 'Table Name', value: tableName }
      : undefined,
    schemaName
      ? { key: 'schema-name', label: 'Schema Name', value: schemaName }
      : undefined,
  ];

  return candidates.filter((row): row is DetailsRow => row !== undefined);
};
