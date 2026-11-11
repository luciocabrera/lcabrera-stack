import type {
  ColumnSizingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type BuildPresetColumnSizingArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly preset: 'default' | 'max' | 'min';
};

export const buildPresetColumnSizing = <TData = Record<string, unknown>>({
  columns,
  preset,
}: BuildPresetColumnSizingArgs<TData>) => {
  if (preset === 'default') {
    return {} as ColumnSizingState<TData>;
  }

  return columns.reduce((sizing, column) => {
    const width = preset === 'max' ? column.maxWidth : column.minWidth;

    if (width) {
      sizing[column.key] = width;
    }

    return sizing;
  }, {} as ColumnSizingState<TData>);
};
