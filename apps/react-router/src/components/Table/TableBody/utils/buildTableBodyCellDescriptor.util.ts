import type { ReactNode } from 'react';

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';

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
  readonly rowData: Record<string, unknown>;
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
  rowData,
}: BuildTableBodyCellDescriptorArgs<TData>): TableBodyCellDescriptor<TData> => {
  const minWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const width = columnSizing[col.key] ?? minWidth;
  const pinInfo = pinnedOffsets[col.key];

  if (col.render) {
    return {
      children: col.render(rowData as TData),
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
    value: col.key in rowData ? rowData[col.key] : '',
    width,
  };
};
