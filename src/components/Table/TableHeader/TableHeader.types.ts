import type { ComponentPropsWithoutRef } from 'react';

import type { TableProps } from '../Table.types';

export type TableHeaderProps<TData extends Record<string, unknown>> =
  ComponentPropsWithoutRef<'thead'> &
    Pick<TableProps<TData>, 'columns' | 'customStylex'> & {
      /** Show skeleton loading state in header cells */
      isLoading?: boolean;
    };
