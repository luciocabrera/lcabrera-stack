export const schemaColumnsOf = (
  tables: Readonly<Record<string, readonly string[]>>,
) =>
  Object.entries(tables).flatMap(([table, columns]) =>
    columns.map((column) => ({
      column,
      dataType: 'integer',
      table,
      udtName: 'int4',
    })),
  );
