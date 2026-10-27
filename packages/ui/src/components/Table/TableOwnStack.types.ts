import type { ReactNode } from 'react';

import type { TableColumn } from './Table.types';

export type TableOwnStackProps<TData extends Record<string, unknown>> = {
  readonly children: ReactNode;
  readonly columns: readonly TableColumn<TData>[];
  readonly title?: string;
};
