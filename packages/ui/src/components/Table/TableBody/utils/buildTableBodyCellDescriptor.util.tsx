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

export type TableBodyCellDescriptor<TData extends Record<string, unknown>> =
  | (TableBodyCellCustomFields<TData> & TableBodyCellDescriptorBase<TData>)
  | (TableBodyCellDefaultFields<TData> & TableBodyCellDescriptorBase<TData>);

type BuildTableBodyCellDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly disclosure?: TableGroupDisclosureState;
  readonly groupingKeys: readonly string[];
  readonly groupSummary?: TableGroupRowSummary;
  readonly hasStructuralMarker: boolean;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

type TableBodyCellCustomFields<TData extends Record<string, unknown>> = {
  readonly children: TableBodyCellProps<TData>['children'];
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

  const structuralChildren = resolveStructuralCellChildren({
    carriedGroupKeys,
    columnKey,
    disclosure,
    groupingKeys,
    groupSummary,
    hasStructuralMarker,
  });

  if (structuralChildren !== undefined) {
    return { ...shared, children: structuralChildren, dataType: col.dataType };
  }

  const customActions = col.render?.(row);

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
