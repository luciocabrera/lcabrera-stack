import type { ComponentPropsWithRef, RefObject } from 'react';

import type { TableCrudConfig, TableEmptyStateConfig } from '../Table.types';

export type TableBodyProps<TData extends Record<string, unknown>> =
  ComponentPropsWithRef<'tbody'> & {
    readonly crud?: TableCrudConfig<TData>;
    readonly emptyState?: TableEmptyStateConfig;
    readonly tableContainerRef: RefObject<HTMLDivElement | null>;
    readonly titleSingular?: string;
  };
