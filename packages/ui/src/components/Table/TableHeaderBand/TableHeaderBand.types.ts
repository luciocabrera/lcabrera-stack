import type { TableColumn } from '#ui/components/Table/Table.types';

export type TableHeaderBandProps<TData extends Record<string, unknown>> = {
  /** The columns this band spans, in painted order. */
  readonly columns: readonly TableColumn<TData>[];
  /** The group's name, or absent when the band only holds space. */
  readonly label?: string;
};
