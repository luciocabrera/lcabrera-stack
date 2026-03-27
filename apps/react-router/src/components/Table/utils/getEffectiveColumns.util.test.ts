import { describe, expect, it } from "vitest";

import type { ColumnPinningState, TableColumn } from "../Table.types.ts";

import { getEffectiveColumns } from "./getEffectiveColumns.util.ts";

type Row = { id: string; name: string; age: number };

const columns: TableColumn<Row>[] = [
  { dataType: "string", key: "id", label: "ID" },
  { dataType: "string", key: "name", label: "Name" },
  { dataType: "number", key: "age", label: "Age" },
];

describe("getEffectiveColumns", () => {
  it("returns all columns when no visibility/order/pinning", () => {
    const result = getEffectiveColumns({ columns });
    expect(result.map((c) => c.key)).toEqual(["id", "name", "age"]);
  });

  it("filters out hidden columns", () => {
    const columnVisibility = new Set<"id" | "name" | "age" | "actions">(["name"]);
    const result = getEffectiveColumns({ columns, columnVisibility });
    expect(result.map((c) => c.key)).toEqual(["id", "age"]);
  });

  it("applies column order", () => {
    const result = getEffectiveColumns({
      columnOrder: ["age", "id", "name"],
      columns,
    });
    expect(result.map((c) => c.key)).toEqual(["age", "id", "name"]);
  });

  it("columns not in order are appended", () => {
    const result = getEffectiveColumns({ columnOrder: ["age"], columns });
    expect(result.map((c) => c.key)).toEqual(["age", "id", "name"]);
  });

  it("applies pinning order: left, unpinned, right", () => {
    const columnPinning: ColumnPinningState<Row> = {
      left: ["id"],
      right: ["age"],
    };
    const result = getEffectiveColumns({ columnPinning, columns });
    expect(result.map((c) => c.key)).toEqual(["id", "name", "age"]);
  });

  it("returns same columns when pinning has empty arrays", () => {
    const columnPinning: ColumnPinningState<Row> = { left: [], right: [] };
    const result = getEffectiveColumns({ columnPinning, columns });
    expect(result.map((c) => c.key)).toEqual(["id", "name", "age"]);
  });
});
