import type { CarSalesResponse } from "@/services";

export type CarSalesPaginatedResponse = CarSalesResponse & { hasMore: boolean };
