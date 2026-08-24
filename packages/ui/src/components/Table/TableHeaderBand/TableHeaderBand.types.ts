import type { TableColumn } from '#ui/components/Table/Table.types';

export type TableHeaderBandProps<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly label?: string;
};
