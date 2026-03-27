import type { SortRule } from "../../types/api.types";

const wideColumnNumbers = Array.from(
  { length: 149 },
  // eslint-disable-next-line local-rules/destructuring-for-functions
  (_value, index) => `c_${String(index + 1).padStart(3, "0")}`,
);

export const WIDE_ALLTYPES_SORTABLE_COLUMNS = new Set(["id", ...wideColumnNumbers]);

export const DEFAULT_WIDE_ALLTYPES_SORTING = [
  { columnKey: "id", direction: "asc" },
] as const satisfies readonly SortRule[];
