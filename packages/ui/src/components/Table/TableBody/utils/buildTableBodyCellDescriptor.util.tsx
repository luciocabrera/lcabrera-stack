import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableBodyCellProps } from '#ui/components/Table/TableBodyCell/TableBodyCell.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';
import { TableRowActionsMenu } from '#ui/components/Table/TableRowActionsMenu';

import { resolveStructuralCellChildren } from './resolveStructuralCellChildren.util';

/**
 * `dataType` travels on **both** branches, so it is not what tells them apart — `kind` is.
 * On the default branch it says how to format the value; on the custom branch the value is
 * already rendered and it says only how the cell aligns (#1018).
 */
export type TableBodyCellDescriptor<TData extends Record<string, unknown>> =
  | (TableBodyCellCustomFields<TData> & TableBodyCellDescriptorBase<TData>)
  | (TableBodyCellDefaultFields<TData> & TableBodyCellDescriptorBase<TData>);

type BuildTableBodyCellDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly disclosure?: TableGroupDisclosureState;
  /**
   * A detail row blanks the columns it is grouped by: the value is stated once by the group
   * row above it, and repeating it down a column whose header already says it is a column of
   * one word (ADR-065).
   */
  readonly groupingKeys: readonly string[];
  /**
   * Asked of the **row**, never of the grouping configuration, so a group row and a detail
   * row can sit in one result.
   */
  readonly groupSummary?: TableGroupRowSummary;
  /**
   * **Required, not optional.** It is always computable and there is one call site; an
   * optional flag defaulting to `false` would let a caller that forgets it compile cleanly
   * and silently disable the fail-closed branch in `resolveStructuralCellChildren` — the
   * same silent-drop shape as the marker loss this exists to fix (#887).
   */
  readonly hasStructuralMarker: boolean;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

type TableBodyCellCustomFields<TData extends Record<string, unknown>> = {
  readonly children: TableBodyCellProps<TData>['children'];
  /**
   * **Required, not optional**, for the same reason `hasStructuralMarker` is: every branch
   * below has to state whether the cell aligns by its column, and an optional field would
   * let one forget silently — which is the shape of the bug this fixes. `undefined` is the
   * consumer-supplied answer, and it is spelled out.
   */
  readonly dataType: TableBodyCellProps<TData>['dataType'];
  readonly kind: 'custom';
  readonly label: '';
};

type TableBodyCellDefaultFields<TData extends Record<string, unknown>> = {
  readonly dataType: TableBodyCellProps<TData>['dataType'];
  readonly format: TableBodyCellProps<TData>['format'];
  readonly kind: 'default';
  readonly label: TableBodyCellProps<TData>['label'];
  readonly value: TableBodyCellProps<TData>['value'];
};

type TableBodyCellDescriptorBase<TData extends Record<string, unknown>> = {
  readonly columnKey: TableBodyCellProps<TData>['columnKey'];
  readonly isLoadingState: NonNullable<
    TableBodyCellProps<TData>['isLoadingState']
  >;
  readonly key: DataKey<TData>;
  readonly minWidth: NonNullable<TableBodyCellProps<TData>['minWidth']>;
  readonly pinInfo: TableBodyCellProps<TData>['pinInfo'];
  readonly rowIndex: TableBodyCellProps<TData>['rowIndex'];
  readonly rowKey: TableBodyCellProps<TData>['rowKey'];
  readonly width: NonNullable<TableBodyCellProps<TData>['width']>;
};

/**
 * Group rows and detail rows come through here alike, because they share one cell grid
 * (ADR-065): the descriptor decides what a cell *holds*, and the chrome around it — the
 * `gridcell` role, the roving tab stop, the sticky offset, the width — is identical either
 * way.
 */
export const buildTableBodyCellDescriptor = <
  TData extends Record<string, unknown>,
>({
  carriedGroupKeys,
  col,
  columnSizing,
  disclosure,
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

  // Grid-supplied content — a group row's own cells, or a detail row's blanked
  // group column — both in one place, because the order among them
  // matters and none of them looks at `row`. `undefined` means this is an
  // ordinary data cell.
  const structuralChildren = resolveStructuralCellChildren({
    carriedGroupKeys,
    columnKey,
    disclosure,
    groupingKeys,
    groupSummary,
    hasStructuralMarker,
  });

  // Grid-supplied content answers in the column's own units — an aggregate, a group key,
  // an em dash, a blanked key column — so it takes the column's alignment and a measure
  // lines up with the detail rows beneath it (#1018).
  if (structuralChildren !== undefined) {
    return { ...shared, children: structuralChildren, dataType: col.dataType };
  }

  const customActions = col.render?.(row);

  // The two consumer-supplied branches carry no `dataType`: what a `render()` returns is
  // the consumer's layout to decide, and the actions menu is chrome with no column type at
  // all. Both keep the cell's default alignment.
  if (col.key === 'actions') {
    return {
      ...shared,
      children: (
        <TableRowActionsMenu
          customActions={customActions}
          isLoadingState={isLoadingState}
          row={row}
        />
      ),
      dataType: undefined,
    };
  }

  if (customActions) {
    return { ...shared, children: customActions, dataType: undefined };
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
