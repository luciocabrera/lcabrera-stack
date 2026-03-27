import { describe, expect, it } from "vitest";

import type { ColumnSizingState, TableColumn } from "../Table.types.ts";

import { getPinnedColumnOffsets } from "./getPinnedColumnOffsets.util.ts";

type Row = { id: string; name: string; age: number; actions: string };

const columns: TableColumn<Row>[] = [
  { dataType: "string", key: "id", label: "ID", minWidth: 60 },
  { dataType: "string", key: "name", label: "Name", minWidth: 120 },
  { dataType: "number", key: "age", label: "Age", minWidth: 80 },
  { dataType: "string", key: "actions", label: "Actions", minWidth: 100 },
];

const emptySizing = {} as ColumnSizingState<Row>;

describe("getPinnedColumnOffsets", () => {
  it("returns empty object when no pinned columns", () => {
    const result = getPinnedColumnOffsets({
      columnPinning: { left: [], right: [] },
      columnSizing: emptySizing,
      effectiveColumns: columns,
    });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("computes left offsets cumulatively", () => {
    const result = getPinnedColumnOffsets({
      columnPinning: { left: ["id", "name"], right: [] },
      columnSizing: emptySizing,
      effectiveColumns: columns,
    });
    expect(result["id"]?.offset).toBe(0);
    expect(result["id"]?.side).toBe("left");
    expect(result["name"]?.offset).toBe(60); // id.minWidth
    expect(result["name"]?.side).toBe("left");
  });

  it("marks last left pinned column as isLastPinnedLeft", () => {
    const result = getPinnedColumnOffsets({
      columnPinning: { left: ["id", "name"], right: [] },
      columnSizing: emptySizing,
      effectiveColumns: columns,
    });
    expect(result["id"]?.isLastPinnedLeft).toBe(false);
    expect(result["name"]?.isLastPinnedLeft).toBe(true);
  });

  it("computes right offsets cumulatively from right", () => {
    const result = getPinnedColumnOffsets({
      columnPinning: { left: [], right: ["age", "actions"] },
      columnSizing: emptySizing,
      effectiveColumns: columns,
    });
    expect(result["actions"]?.offset).toBe(0);
    expect(result["actions"]?.side).toBe("right");
    expect(result["age"]?.offset).toBe(100); // actions.minWidth
  });

  it("marks first right pinned column as isFirstPinnedRight", () => {
    const result = getPinnedColumnOffsets({
      columnPinning: { left: [], right: ["age", "actions"] },
      columnSizing: emptySizing,
      effectiveColumns: columns,
    });
    expect(result["age"]?.isFirstPinnedRight).toBe(true);
    expect(result["actions"]?.isFirstPinnedRight).toBe(false);
  });

  it("uses columnSizing width over minWidth", () => {
    const sizing = { id: 200 } as ColumnSizingState<Row>;
    const result = getPinnedColumnOffsets({
      columnPinning: { left: ["id", "name"], right: [] },
      columnSizing: sizing,
      effectiveColumns: columns,
    });
    expect(result["name"]?.offset).toBe(200); // uses columnSizing for id
  });
});
