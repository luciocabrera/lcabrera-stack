import type { SortingState } from "@/components/Table";

type CompactSorting = Record<string, "asc" | "desc">;

/**
 * Serialize SortingState to a compact URL-friendly string.
 *
 * Converts `[{ columnKey: "name", direction: "asc" }]`
 * into `{"name":"asc"}` — much shorter than the verbose array format.
 */
export const serializeSortingToURL = (sorting: SortingState): string | undefined => {
  if (sorting.length === 0) return undefined;

  const entries = sorting
    .filter(({ direction }) => direction !== undefined)
    .map(({ columnKey, direction }) => [columnKey, direction] as const);

  if (entries.length === 0) return undefined;

  const compact = Object.fromEntries(entries) as CompactSorting;

  return JSON.stringify(compact);
};
