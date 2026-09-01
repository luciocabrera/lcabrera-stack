import type { TableColumn } from '#ui/components/Table/Table.types';

export type TableHeaderBand<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly label?: string;
};

type ResolveHeaderBandsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
};

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
