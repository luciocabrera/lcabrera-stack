import { DEFAULT_PAGE_LIMIT } from "../../constants/server.constants";
import type { SortRule } from "../../types/api.types";

import { CAR_SALES_SORTABLE_COLUMNS } from "./carSales.constants";

/**
 * TypeScript type for the validated /paginated querystring.
 */
export type PaginatedCarSalesQuery = {
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly SortRule[];
};

/**
 * JSON Schema for the /paginated querystring.
 *
 * Fastify validates and coerces query params at the framework level,
 * replacing Zod schemas from the Express version.
 */
export const paginatedCarSalesQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", default: DEFAULT_PAGE_LIMIT, minimum: 1 },
    skip: { type: "integer", default: 0, minimum: 0 },
    sort: {
      type: "array",
      default: [],
      items: {
        type: "object",
        required: ["columnKey", "direction"],
        properties: {
          columnKey: {
            type: "string",
            enum: [...CAR_SALES_SORTABLE_COLUMNS],
          },
          direction: { type: "string", enum: ["asc", "desc"] },
        },
        additionalProperties: false,
      },
    },
  },
};
