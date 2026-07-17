import type {
  ColumnSizingState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

/** Args for {@link buildPresetColumnSizing}. */
type BuildPresetColumnSizingArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly preset: 'default' | 'max' | 'min';
};

/**
 * Builds the bulk column-sizing state for a width preset: `default` clears
 * all custom widths, `max`/`min` size every column that has the matching
 * bound configured and leave the rest untouched.
 */
export const buildPresetColumnSizing = <TData = Record<string, unknown>>({
  columns,
  preset,
}: BuildPresetColumnSizingArgs<TData>) => {
  if (preset === 'default') {
    return {} as ColumnSizingState<TData>;
  }

  const sizedEntries = columns
    .map(
      (column) =>
        [
          column.key,
          preset === 'max' ? column.maxWidth : column.minWidth,
        ] as const,
    )
    .filter(([, width]) => width);

  return Object.fromEntries(sizedEntries) as ColumnSizingState<TData>;
};
