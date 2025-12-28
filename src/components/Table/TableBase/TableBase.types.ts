import type { ComponentPropsWithRef } from 'react';

import type { TableProps } from '../Table.types';

export type TableBaseProps<TData extends Record<string, unknown>> =
  ComponentPropsWithRef<'table'> &
    Pick<
      TableProps<TData>,
      'customStylex' | 'density' | 'isBordered' | 'isStriped'
    >;
