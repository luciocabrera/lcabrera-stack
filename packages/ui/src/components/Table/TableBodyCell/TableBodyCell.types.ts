import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';
import type { TableStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

export type TableBodyCellProps<TData extends Record<string, unknown>> = Omit<
  ComponentPropsWithoutRef<'td'>,
  'align' | 'width'
> &
  Pick<
    TableColumn<TData>,
    'align' | 'dataType' | 'format' | 'label' | 'minWidth'
  > & {
    readonly children?: ReactNode;
    readonly columnKey: string;
    readonly customStylex?: StyleXStyles;
    readonly isFill?: boolean;
    readonly isLoadingState?: boolean;
    readonly locale?: string;
    readonly pinInfo?: PinnedColumnInfo;
    readonly rowIndex: number;
    readonly rowKey: string;
    readonly staticWidths?: TableStaticColumnWidths;
    readonly value?: unknown;
    readonly width?: number;
  };
