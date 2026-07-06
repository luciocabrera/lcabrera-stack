import type { TableCrudConfig } from '../Table.types';

export type TableBodyRowsProps<TData extends Record<string, unknown>> = {
  readonly crud?: TableCrudConfig<TData>;
  readonly endIndex: number;
  readonly isLoadingState: boolean;
  readonly startIndex: number;
  readonly titleSingular?: string;
};
