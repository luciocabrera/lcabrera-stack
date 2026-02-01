import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '../Table.types';

export type TableBodyCellProps<TData extends Record<string, unknown>> = ComponentPropsWithoutRef<'td'> &
  Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
    customStylex?: StyleXStyles;
    /** Locale for formatting */
    locale?: string;
    value: unknown;
    width?: number | string;
  };
