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

    // Truthiness, not `width !== undefined`: a configured width of `0` is
    // dropped here exactly as the previous `.filter(([, width]) => width)`
    // dropped it. Assigning the key directly is what makes this worth doing —
    // the cost this replaces was `Object.fromEntries` over per-element `as
    // const` tuples, not the second pass react-doctor flagged.
    if (width) {
      sizing[column.key] = width;
    }

    return sizing;
  }, {} as ColumnSizingState<TData>);
};
