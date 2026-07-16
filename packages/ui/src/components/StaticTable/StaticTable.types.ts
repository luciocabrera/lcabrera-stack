import type { TableColumn } from '@repo/ui/components/Table';
import type { ReactNode } from 'react';

export type StaticTableProps<TData extends Record<string, unknown>> = {
  readonly actions?: ReactNode;
  readonly columns: readonly TableColumn<TData>[];
  readonly rows: readonly TData[];
  readonly title?: string;
};
