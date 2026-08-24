import type { TableColumn } from '#ui/components/Table/Table.types';

export type TableHeaderBand<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly label?: string;
};

type ResolveHeaderBandsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * A band is a visual span, so it can only cover columns that are actually next to each
 * other; grouping by label alone would produce a band claiming to cover two columns with a
 * third between them.
 * Called per pinned partition rather than over the whole grid, so a band can never
 * straddle the boundary between the pinned and scrolling regions, which are separately
 * positioned and would tear a span in half.
 */
export const resolveHeaderBands = <TData>({
  columns,
}: ResolveHeaderBandsArgs<TData>): readonly TableHeaderBand<TData>[] => {
  const bands: TableHeaderBand<TData>[] = [];

  for (const column of columns) {
    const previous = bands.at(-1);

    if (
      column.headerGroupLabel !== undefined &&
      previous?.label === column.headerGroupLabel
    ) {
      bands[bands.length - 1] = {
        columns: [...previous.columns, column],
        label: previous.label,
      };
      continue;
    }

    bands.push({
      columns: [column],
      ...(column.headerGroupLabel !== undefined && {
        label: column.headerGroupLabel,
      }),
    });
  }

  return bands;
};

export const hasHeaderBands = <TData>(columns: readonly TableColumn<TData>[]) =>
  columns.some((column) => column.headerGroupLabel !== undefined);
