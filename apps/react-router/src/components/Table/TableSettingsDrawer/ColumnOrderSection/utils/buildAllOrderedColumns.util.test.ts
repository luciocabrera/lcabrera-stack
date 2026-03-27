import { describe, expect, it } from "vitest";

import type { TableColumn } from "@/components/Table/Table.types";

import { buildAllOrderedColumns } from "./buildAllOrderedColumns.util.ts";

type Row = { id: string; name: string; age: number };

const columns: TableColumn<Row>[] = [
  { dataType: "string", key: "id", label: "ID" },
  { dataType: "string", key: "name", label: "Name" },
  { dataType: "number", key: "age", label: "Age" },
];

describe("buildAllOrderedColumns", () => {
  it("returns columns in definition order when columnsOrder is empty", () => {
    const result = buildAllOrderedColumns({ columns, columnsOrder: [] });
    expect(result.map((c) => c.key)).toEqual(["id", "name", "age"]);
  });

  it("orders columns according to columnsOrder", () => {
    const result = buildAllOrderedColumns({
      columns,
      columnsOrder: ["age", "id", "name"],
    });
    expect(result.map((c) => c.key)).toEqual(["age", "id", "name"]);
  });

  it("appends columns not present in columnsOrder", () => {
    const result = buildAllOrderedColumns({ columns, columnsOrder: ["name"] });
    expect(result.map((c) => c.key)).toEqual(["name", "id", "age"]);
  });

  it("ignores keys in columnsOrder not found in columns", () => {
    const result = buildAllOrderedColumns({
      columns,
      columnsOrder: ["unknown", "id"],
    });
    expect(result.map((c) => c.key)).toEqual(["id", "name", "age"]);
  });
});
