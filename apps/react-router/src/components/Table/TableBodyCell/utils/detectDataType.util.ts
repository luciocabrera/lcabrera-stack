import type { TableColumnDataType } from "../../Table.types.ts";

export const detectDataType = (value: unknown): TableColumnDataType => {
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "string") {
    // Check if it's a currency (starts with $ or other currency symbols)
    if (/^[$€£¥₹]/.test(value)) {
      return "currency";
    }
    // Check if it's a date (ISO date format YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return "date";
    }
  }
  return "string";
};
