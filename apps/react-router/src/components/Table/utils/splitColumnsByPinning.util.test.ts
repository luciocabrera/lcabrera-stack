import { describe, expect, it } from "vitest";

import { splitColumnsByPinning } from "./splitColumnsByPinning.util.ts";

describe("splitColumnsByPinning", () => {
  it("groups all columns as center when nothing is pinned", () => {
    const columns = [
      { key: "a" as const, label: "A" },
      { key: "b" as const, label: "B" },
      { key: "c" as const, label: "C" },
    ];
    const result = splitColumnsByPinning({
      columnPinning: { left: [], right: [] },
      effectiveColumns: columns,
    });

    expect(result.leftPinnedCols).toHaveLength(0);
    expect(result.rightPinnedCols).toHaveLength(0);
    expect(result.centerCols).toHaveLength(3);
  });

  it("separates left-pinned, center, and right-pinned columns", () => {
    const columns = [
      { key: "left1" as const, label: "L1", minWidth: 80 },
      { key: "center1" as const, label: "C1", minWidth: 100 },
      { key: "center2" as const, label: "C2", minWidth: 120 },
      { key: "right1" as const, label: "R1", minWidth: 90 },
    ];
    const result = splitColumnsByPinning({
      columnPinning: { left: ["left1"], right: ["right1"] },
      effectiveColumns: columns,
    });

    expect(result.leftPinnedCols.map((c) => c.key)).toEqual(["left1"]);
    expect(result.rightPinnedCols.map((c) => c.key)).toEqual(["right1"]);
    expect(result.centerCols.map((c) => c.key)).toEqual(["center1", "center2"]);
  });

  it("handles columns that exist in pinning but not in effectiveColumns", () => {
    const columns = [
      { key: "a" as const, label: "A" },
      { key: "b" as const, label: "B" },
    ];
    const result = splitColumnsByPinning({
      columnPinning: { left: ["missing" as "a"], right: [] },
      effectiveColumns: columns,
    });

    expect(result.leftPinnedCols).toHaveLength(0);
    expect(result.centerCols).toHaveLength(2);
  });
});
