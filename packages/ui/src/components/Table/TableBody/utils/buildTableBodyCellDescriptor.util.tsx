import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';
import type { TableBodyCellProps } from '@lcabrera/ui/components/Table/TableBodyCell/TableBodyCell.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@lcabrera/ui/components/Table/Table.constants';
import { TableRowActionsMenu } from '@lcabrera/ui/components/Table/TableRowActionsMenu';

/**
 * `kind` is a rendering decision, not a column type: `custom` for the actions
 * column and for any column supplying `render()`, `default` otherwise. The
 * column's own type travels as `dataType` on the default branch, so a new
 * `dataType` never grows this union.
 */
export type TableBodyCellDescriptor<TData extends Record<string, unknown>> =
  | (TableBodyCellCustomFields<TData> & TableBodyCellDescriptorBase<TData>)
  | (TableBodyCellDefaultFields<TData> & TableBodyCellDescriptorBase<TData>);

type BuildTableBodyCellDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly row: TData;
};

/** Fields only a `custom` cell carries. */
type TableBodyCellCustomFields<TData extends Record<string, unknown>> = {
  readonly children: TableBodyCellProps<TData>['children'];
  readonly kind: 'custom';
  /**
   * The cell renders `children`, so no label is ever displayed — but the prop
   * is required, so the descriptor still has to carry one.
   */
  readonly label: '';
};

/** Fields only a `default` cell carries. */
type TableBodyCellDefaultFields<TData extends Record<string, unknown>> = {
  readonly dataType: TableBodyCellProps<TData>['dataType'];
  readonly format: TableBodyCellProps<TData>['format'];
  readonly kind: 'default';
  readonly label: TableBodyCellProps<TData>['label'];
  readonly value: TableBodyCellProps<TData>['value'];
};

/**
 * The fields both descriptor kinds carry.
 *
 * Every field is read back off `TableBodyCellProps` rather than re-declared,
 * because every field exists to be spread into `TableBodyCell`: renaming or
 * retyping a prop there is then a type error here, rather than a prop that
 * quietly stops arriving at the `createElement` call in `renderFromDescriptor`.
 * `NonNullable` marks the ones the builder always computes even though the prop
 * lets a caller omit them.
 */
type TableBodyCellDescriptorBase<TData extends Record<string, unknown>> = {
  readonly isLoadingState: NonNullable<
    TableBodyCellProps<TData>['isLoadingState']
  >;
  /** React's `key` for the cell element — not a prop. */
  readonly key: DataKey<TData>;
  readonly minWidth: NonNullable<TableBodyCellProps<TData>['minWidth']>;
  readonly pinInfo: TableBodyCellProps<TData>['pinInfo'];
  readonly width: NonNullable<TableBodyCellProps<TData>['width']>;
};

/**
 * Builds the props-derived descriptor needed to render a TableBodyCell.
 */
export const buildTableBodyCellDescriptor = <
  TData extends Record<string, unknown>,
>({
  col,
  columnSizing,
  isLoadingState,
  pinnedOffsets,
  row,
}: BuildTableBodyCellDescriptorArgs<TData>): TableBodyCellDescriptor<TData> => {
  const minWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const width = columnSizing[col.key] ?? minWidth;
  const pinInfo = pinnedOffsets[col.key];

  const customActions = col.render?.(row);

  if (col.key === 'actions') {
    return {
      children: (
        <TableRowActionsMenu
          customActions={customActions}
          isLoadingState={isLoadingState}
          row={row}
        />
      ),
      isLoadingState,
      key: col.key,
      kind: 'custom',
      label: '',
      minWidth,
      pinInfo,
      width,
    };
  }

  if (customActions) {
    return {
      children: customActions,
      isLoadingState,
      key: col.key,
      kind: 'custom',
      label: '',
      minWidth,
      pinInfo,
      width,
    };
  }

  return {
    dataType: col.dataType,
    format: col.format,
    isLoadingState,
    key: col.key,
    kind: 'default',
    label: col.label,
    minWidth,
    pinInfo,
    value: Object.hasOwn(row, col.key) ? row[col.key] : '',
    width,
  };
};
