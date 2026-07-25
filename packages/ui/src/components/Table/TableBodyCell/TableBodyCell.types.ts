import type {
  PinnedColumnInfo,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

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
    /** Custom content that overrides the default cell rendering */
    readonly children?: ReactNode;
    readonly customStylex?: StyleXStyles;
    readonly isLoadingState?: boolean;
    /** Locale for formatting */
    readonly locale?: string;
    readonly pinInfo?: PinnedColumnInfo;
    readonly value?: unknown;
    readonly width?: number;
  };
