import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '../Table.types';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> &
  Pick<TableColumn, 'dataType' | 'format' | 'label' | 'minWidth'> & {
    customStylex?: StyleXStyles;
    /** Whether the cell is in loading state */
    isLoading?: boolean;
    /** Locale for formatting */
    locale?: string;
    value: unknown;
    width?: number | string;
  };
