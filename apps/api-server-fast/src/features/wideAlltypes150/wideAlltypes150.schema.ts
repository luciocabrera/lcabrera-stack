import { DEFAULT_PAGE_LIMIT, MAX_WIDE_ALLTYPES_LIMIT } from "../../constants/server.constants";
import type { SortRule } from "../../types/api.types";

import { WIDE_ALLTYPES_SORTABLE_COLUMNS } from "./wideAlltypes150.constants";

/**
 * TypeScript type for the /paginated querystring.
 */
export type PaginatedWideAlltypesQuery = {
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly SortRule[];
};

/**
 * JSON Schema for the /paginated querystring.
 *
 * Replaces the Zod-based `parseWideAlltypesSorting` from the Express version.
 */
export const paginatedWideAlltypesQuerySchema = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      default: DEFAULT_PAGE_LIMIT,
      maximum: MAX_WIDE_ALLTYPES_LIMIT,
      minimum: 1,
    },
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
            enum: [...WIDE_ALLTYPES_SORTABLE_COLUMNS],
          },
          direction: { type: "string", enum: ["asc", "desc"] },
        },
        additionalProperties: false,
      },
    },
  },
};
