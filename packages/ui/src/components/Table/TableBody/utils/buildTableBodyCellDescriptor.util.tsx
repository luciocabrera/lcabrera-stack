import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableDrillRowMarker,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableBodyCellProps } from '#ui/components/Table/TableBodyCell/TableBodyCell.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';
import { TableRowActionsMenu } from '#ui/components/Table/TableRowActionsMenu';

import { resolveStructuralCellChildren } from './resolveStructuralCellChildren.util';

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
  /**
   * Which of this row's group-key columns repeat the row above and render
   * blank. Empty for a detail row, which blanks every key column outright.
   */
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  /**
   * The row's place in the tree, when it has one. Resolved from the group tree
   * rather than from the summary, because whether a row owns rows is a question
   * about the other rows — see `TableGroupDisclosure.types.ts`.
   */
  readonly disclosure?: TableGroupDisclosureState;
  /**
   * Present when the row is grid-created drill chrome — a page in flight, a
   * failure, or the hand-off past one page (ADR-079). Asked of the **row**, like
   * the group summary beside it, so all three kinds of row arrive in one array.
   */
  readonly drillRow?: TableDrillRowMarker;
  /**
   * The applied group keys. A detail row blanks the columns it is grouped by:
   * the value is stated once by the group row above it, and repeating it down a
   * column whose header already says it is a column of one word (ADR-065).
   */
  readonly groupingKeys: readonly string[];
  /**
   * Present when the row carries a group summary, absent when it is a detail
   * row. Asked of the **row**, never of the grouping configuration, so a group
   * row and a detail row can sit in one result.
   */
  readonly groupSummary?: TableGroupRowSummary;
  /**
   * See `hasTableStructuralMarker` — a row that claims to be chrome.
   *
   * **Required, not optional.** It is always computable and there is one call
   * site; an optional flag defaulting to `false` would let a caller that
   * forgets it compile cleanly and silently disable the fail-closed branch in
   * `resolveStructuralCellChildren` — the same silent-drop shape as the
   * `drillRow` bug this exists to fix.
   */
  readonly hasStructuralMarker: boolean;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
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
  readonly columnKey: TableBodyCellProps<TData>['columnKey'];
  readonly isLoadingState: NonNullable<
    TableBodyCellProps<TData>['isLoadingState']
  >;
  /** React's `key` for the cell element — not a prop. */
  readonly key: DataKey<TData>;
  readonly minWidth: NonNullable<TableBodyCellProps<TData>['minWidth']>;
  readonly pinInfo: TableBodyCellProps<TData>['pinInfo'];
  readonly rowIndex: TableBodyCellProps<TData>['rowIndex'];
  readonly rowKey: TableBodyCellProps<TData>['rowKey'];
  readonly width: NonNullable<TableBodyCellProps<TData>['width']>;
};

/**
 * Builds the props-derived descriptor needed to render a TableBodyCell.
 *
 * Group rows and detail rows come through here alike, because they share one
 * cell grid (ADR-065): the descriptor decides what a cell *holds*, and the
 * chrome around it — the `gridcell` role, the roving tab stop, the sticky
 * offset, the width — is identical either way. That is what makes a group row a
 * first-class focus target with no branch anywhere in the focus model.
 */
export const buildTableBodyCellDescriptor = <
  TData extends Record<string, unknown>,
>({
  carriedGroupKeys,
  col,
  columnSizing,
  disclosure,
  drillRow,
  groupingKeys,
  groupSummary,
  hasStructuralMarker,
  isLoadingState,
  pinnedOffsets,
  row,
  rowIndex,
  rowKey,
}: BuildTableBodyCellDescriptorArgs<TData>): TableBodyCellDescriptor<TData> => {
  const minWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const width = columnSizing[col.key] ?? minWidth;
  const pinInfo = pinnedOffsets[col.key];
  const columnKey = col.key as string;
  const shared = {
    columnKey,
    isLoadingState,
    key: col.key,
    kind: 'custom',
    label: '',
    minWidth,
    pinInfo,
    rowIndex,
    rowKey,
    width,
  } as const;

  // Grid-supplied content — drill chrome, a group row's own cells, or a detail
  // row's blanked group column — all in one place, because the order among them
  // matters and none of them looks at `row`. `undefined` means this is an
  // ordinary data cell.
  const structuralChildren = resolveStructuralCellChildren({
    carriedGroupKeys,
    columnKey,
    disclosure,
    drillRow,
    groupingKeys,
    groupSummary,
    hasStructuralMarker,
  });

  if (structuralChildren !== undefined) {
    return { ...shared, children: structuralChildren };
  }

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
      columnKey,
      isLoadingState,
      key: col.key,
      kind: 'custom',
      label: '',
      minWidth,
      pinInfo,
      rowIndex,
      rowKey,
      width,
    };
  }

  if (customActions) {
    return {
      children: customActions,
      columnKey,
      isLoadingState,
      key: col.key,
      kind: 'custom',
      label: '',
      minWidth,
      pinInfo,
      rowIndex,
      rowKey,
      width,
    };
  }

  return {
    columnKey,
    dataType: col.dataType,
    format: col.format,
    isLoadingState,
    key: col.key,
    kind: 'default',
    label: col.label,
    minWidth,
    pinInfo,
    rowIndex,
    rowKey,
    value: Object.hasOwn(row, col.key) ? row[col.key] : '',
    width,
  };
};
