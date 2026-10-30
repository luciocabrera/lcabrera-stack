import type { ReactNode } from 'react';

import type { TableColumn } from '../Table.types';

export type TableOwnStackChromeProvidersProps<
  TData extends Record<string, unknown>,
> = {
  readonly children: ReactNode;
  readonly columns: readonly TableColumn<TData>[];
};

export type TableOwnStackProps<TData extends Record<string, unknown>> =
  TableOwnStackChromeProvidersProps<TData> & {
    readonly hasChrome: boolean;
    readonly title?: string;
  };
