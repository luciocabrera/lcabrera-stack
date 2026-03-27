import { describe, expect, it } from "vitest";

import { generatePlaceholderData } from "./generatePlaceholderData.util.ts";

describe("generatePlaceholderData", () => {
  it("generates correct number of rows", () => {
    const result = generatePlaceholderData({
      columns: [{ key: "id" }, { key: "name" }],
      rowCount: 3,
    });
    expect(result).toHaveLength(3);
  });

  it("each row has empty string for each column key", () => {
    const result = generatePlaceholderData({
      columns: [{ key: "id" }, { key: "name" }],
      rowCount: 1,
    });
    expect(result[0]).toEqual({ id: "", name: "" });
  });

  it("returns empty array for rowCount 0", () => {
    expect(generatePlaceholderData({ columns: [{ key: "id" }], rowCount: 0 })).toEqual([]);
  });

  it("handles empty columns array", () => {
    const result = generatePlaceholderData({ columns: [], rowCount: 2 });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({});
  });
});
