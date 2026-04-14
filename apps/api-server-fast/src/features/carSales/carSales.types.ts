import type { DbRow, PaginatedResponse } from 'api-shared';

export type CarSalesResponse = {
  readonly data: readonly DbRow[];
  readonly total: number;
};

export type PaginatedCarSalesResponse = PaginatedResponse<DbRow>;
