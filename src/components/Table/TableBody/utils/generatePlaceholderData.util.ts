type GeneratePlaceholderDataParams = {
  readonly columns: readonly { readonly key: string }[];
  readonly rowCount: number;
};

/**
 * Generates placeholder data for skeleton loading state
 */
export const generatePlaceholderData = <TData extends Record<string, unknown>>({
  columns,
  rowCount,
}: GeneratePlaceholderDataParams): TData[] =>
  Array.from({ length: rowCount }, () =>
    Object.fromEntries(columns.map((col) => [col.key, ''])),
  ) as TData[];
