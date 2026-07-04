import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  PinnedColumnInfo,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

export type TableBodyCellProps<TData extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'td'> &
    Pick<TableColumn<TData>, 'dataType' | 'format' | 'label' | 'minWidth'> & {
      /** Custom content that overrides the default cell rendering */
      readonly children?: ReactNode;
      readonly customStylex?: StyleXStyles;
      readonly isLoadingState?: boolean;
      /** Locale for formatting */
      readonly locale?: string;
      readonly pinInfo?: PinnedColumnInfo;
      readonly value?: unknown;
      readonly width?: number | string;
    };
