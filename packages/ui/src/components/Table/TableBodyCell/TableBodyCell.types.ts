import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

export type TableBodyCellProps<TData extends Record<string, unknown>> = Omit<
  ComponentPropsWithoutRef<'td'>,
  'width'
> &
  Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
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
