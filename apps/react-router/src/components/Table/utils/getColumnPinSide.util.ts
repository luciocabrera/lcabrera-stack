import type { ColumnPinningState, DataKey } from "@/components/Table/Table.types";

export const getColumnPinSide = <TData = Record<string, unknown>>(
  pinning: ColumnPinningState<TData> | undefined,
  columnKey: DataKey<TData>,
): "left" | "right" | undefined => {
  if (pinning?.left.includes(columnKey)) return "left";
  if (pinning?.right.includes(columnKey)) return "right";
  return undefined;
};
