type GeneratePlaceholderDataParams = {
  readonly columns: readonly { readonly key: string }[];
  readonly rowCount: number;
};

export const generatePlaceholderData = <TData extends Record<string, unknown>>({
  columns,
  rowCount,
}: GeneratePlaceholderDataParams) =>
  Array.from({ length: rowCount }, () =>
    Object.fromEntries(columns.map((col) => [col.key, ''])),
  ) as TData[];
