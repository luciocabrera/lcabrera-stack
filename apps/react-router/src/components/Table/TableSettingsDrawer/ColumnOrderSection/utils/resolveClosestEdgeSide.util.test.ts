import { describe, expect, it } from "vitest";

import type { TableColumn } from "@/components/Table/Table.types";

import { resolveClosestEdgeSide } from "./resolveClosestEdgeSide.util.ts";

type Row = { id: string; name: string; age: number; actions: string };

const cols: TableColumn<Row>[] = [
  { dataType: "string", key: "id", label: "ID" },
  { dataType: "string", key: "name", label: "Name" },
  { dataType: "number", key: "age", label: "Age" },
  { dataType: "string", key: "actions", label: "Actions" },
];

describe("resolveClosestEdgeSide", () => {
  it("returns explicit left side directly", () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: "age",
        pinSide: "left",
      }),
    ).toBe("left");
  });

  it("returns explicit right side directly", () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: "age",
        pinSide: "right",
      }),
    ).toBe("right");
  });

  it("resolves closest-edge to left for column in first half", () => {
    // cols has 4 elements, midpoint = 2, index 0 ('id') < 2 => left
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: "id",
        pinSide: "closest-edge",
      }),
    ).toBe("left");
  });

  it("resolves closest-edge to right for column in second half", () => {
    // index 3 ('actions') >= 2 => right
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: "actions",
        pinSide: "closest-edge",
      }),
    ).toBe("right");
  });

  it("resolves closest-edge to right for column at midpoint", () => {
    // index 2 ('age') >= midpoint(2) => right
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: "age",
        pinSide: "closest-edge",
      }),
    ).toBe("right");
  });
});
