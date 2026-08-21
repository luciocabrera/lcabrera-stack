import type { TableColumn } from '#ui/components/Table/Table.types';

/**
 * One band of the header's upper row: the columns it spans, and the label it
 * states above them — or no label, when the band exists only to hold the space
 * above a column that has no group.
 */
export type TableHeaderBand<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly label?: string;
};

type ResolveHeaderBandsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The upper header row's bands: **runs of adjacent columns sharing a
 * `headerGroupLabel`**, with every other column standing alone.
 *
 * Adjacency is the whole rule, and it is deliberate rather than a shortcut. A
 * band is a visual span, so it can only cover columns that are actually next to
 * each other; grouping by label alone would produce a band claiming to cover
 * two columns with a third between them. `withAggregateColumns` emits a
 * column's measures together and the order derivation keeps them together, so
 * in practice a run is exactly one source column's measures — and if a user
 * ever drags one away, this splits the band rather than drawing a false one.
 *
 * Called per pinned partition rather than over the whole grid, so a band can
 * never straddle the boundary between the pinned and scrolling regions, which
 * are separately positioned and would tear a span in half.
 *
 * A column with no `headerGroupLabel` still gets a band, unlabelled. Every
 * column needs something above it or the two rows stop lining up — the upper
 * row is laid out by flex, not by table spanning, so a missing cell shifts
 * every band after it rather than leaving a gap.
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

/** Whether any column in this grid asks for a band row at all. */
export const hasHeaderBands = <TData>(columns: readonly TableColumn<TData>[]) =>
  columns.some((column) => column.headerGroupLabel !== undefined);
