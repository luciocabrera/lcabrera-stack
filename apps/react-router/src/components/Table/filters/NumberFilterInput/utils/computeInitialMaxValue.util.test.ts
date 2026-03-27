import { describe, expect, it } from "vitest";

import { computeInitialMaxValue } from "./computeInitialMaxValue.util.ts";

describe("computeInitialMaxValue", () => {
  it("returns empty string when filter is undefined", () => {
    expect(computeInitialMaxValue(undefined)).toBe("");
  });

  it("returns value2 for between operator", () => {
    expect(
      computeInitialMaxValue({
        operator: "between",
        type: "number",
        value: 10,
        value2: 20,
      }),
    ).toBe(20);
  });

  it("returns empty string for between operator without value2", () => {
    expect(
      computeInitialMaxValue({
        operator: "between",
        type: "number",
        value: 10,
      }),
    ).toBe("");
  });

  it("returns empty string for non-between operator", () => {
    expect(computeInitialMaxValue({ operator: "equals", type: "number", value: 42 })).toBe("");
  });
});
