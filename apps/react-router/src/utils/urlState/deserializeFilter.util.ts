import type { ColumnFilter } from "@/types/filterOperators.types";

import {
  DATE_OPERATOR_SHORT_CODES,
  KNOWN_OPERATOR_SHORT_CODES,
  SHORT_TO_OPERATOR,
  TEXT_OPERATOR_SHORT_CODES,
} from "@/constants/filterOperators.constants";

const expandOperator = (short: string): string => SHORT_TO_OPERATOR.get(short) ?? short;

const isDateValue = (v: unknown): boolean => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);

/**
 * Deserialize a single compact filter value back to a ColumnFilter.
 *
 * Infers the filter type from the value shape and expands short operator codes.
 * Returns undefined if the value cannot be parsed.
 */
export const deserializeFilter = (value: unknown): ColumnFilter | undefined => {
  // Boolean: bare true/false
  if (typeof value === "boolean") {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    return { type: "boolean", value };
  }

  if (!Array.isArray(value)) return undefined;

  const arr = value as unknown[];

  // Empty array — skip
  if (arr.length === 0) return undefined;

  const first = arr[0];

  // Select notEquals: ["!", "Low", ...]
  if (first === "!") {
    const values = arr.slice(1) as string[];
    return { operator: "notEquals", type: "select", values };
  }

  // If first element is a known operator code → typed filter
  if (typeof first === "string" && KNOWN_OPERATOR_SHORT_CODES.has(first)) {
    const op = expandOperator(first);

    // Number filter: operator + numeric value(s)
    if (typeof arr[1] === "number") {
      return first === "bw"
        ? {
            operator: op as "between",
            type: "number",
            value: arr[1],
            value2: arr[2] as number,
          }
        : {
            operator: op as "equals",
            type: "number",
            value: arr[1],
          };
    }

    // Date filter: date operators + date-like string
    if (DATE_OPERATOR_SHORT_CODES.has(first) && isDateValue(arr[1])) {
      return first === "bw"
        ? {
            operator: "between",
            type: "date",
            value: arr[1] as string,
            value2: arr[2] as string,
          }
        : {
            operator: op as "after",
            type: "date",
            value: arr[1] as string,
          };
    }

    // Text filter: text operators + string value
    if (TEXT_OPERATOR_SHORT_CODES.has(first) && typeof arr[1] === "string") {
      return {
        operator: op as "contains",
        type: "text",
        value: arr[1],
      };
    }
  }

  // Plain string array → select equals
  if (arr.every((item) => typeof item === "string")) {
    return { operator: "equals", type: "select", values: arr };
  }

  return undefined;
};
