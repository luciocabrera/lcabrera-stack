import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
} from '@/components/Table/Table.types';

export type TableBodyCellProps<TData extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'td'> &
    Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
      /** Custom content that overrides the default cell rendering */
      children?: ReactNode;
      customStylex?: StyleXStyles;
      /** Locale for formatting */
      locale?: string;
      pinInfo?: PinnedColumnInfo;
      value?: unknown;
      width?: number | string;
    };
