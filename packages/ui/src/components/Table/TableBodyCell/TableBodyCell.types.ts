import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
  TableColumnAlign,
} from '#ui/components/Table/Table.types';
import type { TableStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

export type TableBodyCellLayout = {
  readonly align?: TableColumnAlign;
  readonly isFill?: boolean;
  readonly staticWidths?: TableStaticColumnWidths;
};

export type TableBodyCellProps<TData extends Record<string, unknown>> = Omit<
  ComponentPropsWithoutRef<'td'>,
  'align' | 'width'
> &
  Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
    readonly cellLayout?: TableBodyCellLayout;
    readonly children?: ReactNode;
    readonly columnKey: string;
    readonly customStylex?: StyleXStyles;
    readonly isLoadingState?: boolean;
    readonly locale?: string;
    readonly pinInfo?: PinnedColumnInfo;
    readonly rowIndex: number;
    readonly rowKey: string;
    readonly value?: unknown;
    readonly width?: number;
  };
