import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@repo/ui/components/Table/Table.constants';
import { TableRowActionsMenu } from '@repo/ui/components/Table/TableRowActionsMenu';

export type TableBodyCellDescriptor<TData extends Record<string, unknown>> =
  | {
      readonly children: ReactNode;
      readonly isLoadingState: boolean;
      readonly key: DataKey<TData>;
      readonly kind: 'custom';
      readonly label: '';
      readonly minWidth: number;
      readonly pinInfo: PinnedColumnInfo | undefined;
      readonly width: number;
    }
  | {
      readonly dataType: TableColumn<TData>['dataType'];
      readonly format: TableColumn<TData>['format'];
      readonly isLoadingState: boolean;
      readonly key: DataKey<TData>;
      readonly kind: 'default';
      readonly label: string;
      readonly minWidth: number;
      readonly pinInfo: PinnedColumnInfo | undefined;
      readonly value: unknown;
      readonly width: number;
    };

type BuildTableBodyCellDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly row: TData;
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
