import type { TableProps } from '../Table.types';

export type SkeletonResponse<TData extends Record<string, unknown>> = {
  readonly data: TData[];
  readonly totalRows: number;
};

export type TableSkeletonProps<TData extends Record<string, unknown>> = Pick<
  TableProps<TData, SkeletonResponse<TData>>,
  'actions'
>;
