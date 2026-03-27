import type { EnterpriseOrder } from "@/services";

export type FieldConfig = {
  format?: "boolean" | "currency" | "date";
  key: keyof EnterpriseOrder;
  label: string;
};

export type FormatValueArgs = {
  format?: "boolean" | "currency" | "date";
  value: boolean | null | number | string | undefined;
};
