import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

/**
 * `width` is omitted from the native `td` attributes and re-declared: the
 * attribute accepts `string | number`, but this cell never forwards it to the
 * DOM — it feeds a StyleX dynamic style, and every width the table produces is
 * a pixel count from `ColumnSizingState`, like the `minWidth` beside it.
 */
export type TableBodyCellProps<TData extends Record<string, unknown>> = Omit<
  ComponentPropsWithoutRef<'td'>,
  'width'
> &
  Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
    readonly children?: ReactNode;
    /**
     * Together with `rowKey` it is the cell's address in the grid, which is what the roving
     * focus points at (ADR-062).
     */
    readonly columnKey: string;
    readonly customStylex?: StyleXStyles;
    readonly isLoadingState?: boolean;
    readonly locale?: string;
    readonly pinInfo?: PinnedColumnInfo;
    readonly rowIndex: number;
    /** Data-derived identity of the cell's row (ADR-062), never its position. */
    readonly rowKey: string;
    readonly value?: unknown;
    readonly width?: number;
  };
