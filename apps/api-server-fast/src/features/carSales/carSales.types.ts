import type { DbRow, PaginatedResponse } from "../../types/api.types";

export type CarSalesResponse = {
  readonly data: readonly DbRow[];
  readonly total: number;
};

export type PaginatedCarSalesResponse = PaginatedResponse<DbRow>;
