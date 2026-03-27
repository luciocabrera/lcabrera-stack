import { describe, expect, it } from "vitest";

import { findFirstVisibleIndex } from "./findFirstVisibleIndex.util.ts";

describe("findFirstVisibleIndex", () => {
  it("returns first partially visible column index", () => {
    const result = findFirstVisibleIndex({
      starts: [0, 100, 200, 300],
      viewStart: 150,
      widths: [100, 100, 100, 100],
    });

    expect(result).toBe(1);
  });

  it("returns starts.length when all columns are fully left of viewport", () => {
    const result = findFirstVisibleIndex({
      starts: [0, 100, 200],
      viewStart: 400,
      widths: [100, 100, 100],
    });

    expect(result).toBe(3);
  });

  it("treats missing width entries as zero", () => {
    const result = findFirstVisibleIndex({
      starts: [0, 100, 200],
      viewStart: 50,
      widths: [100],
    });

    expect(result).toBe(0);
  });
});
