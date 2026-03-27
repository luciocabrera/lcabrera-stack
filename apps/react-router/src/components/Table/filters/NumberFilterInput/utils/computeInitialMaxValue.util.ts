import type { NumberFilter } from "@/types/filterOperators.types";

export const computeInitialMaxValue = (filter: NumberFilter | undefined): "" | number => {
  if (filter?.operator === "between") {
    return filter.value2 ?? "";
  }
  return "";
};
