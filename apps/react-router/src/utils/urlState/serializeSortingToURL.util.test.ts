import { describe, expect, it } from "vitest";

import { serializeSortingToURL } from "./serializeSortingToURL.util.ts";

describe("serializeSortingToURL", () => {
  it("returns undefined for empty sorting", () => {
    expect(serializeSortingToURL([])).toBeUndefined();
  });

  it("serializes a single sort entry", () => {
    const result = serializeSortingToURL([{ columnKey: "name", direction: "asc" }]);
    expect(result).toBeDefined();
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed["name"]).toBe("asc");
  });

  it("serializes multiple sort entries", () => {
    const result = serializeSortingToURL([
      { columnKey: "name", direction: "asc" },
      { columnKey: "age", direction: "desc" },
    ]);
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed["name"]).toBe("asc");
    expect(parsed["age"]).toBe("desc");
  });

  it("returns undefined when all entries have undefined direction", () => {
    const result = serializeSortingToURL([{ columnKey: "name", direction: undefined }]);
    expect(result).toBeUndefined();
  });
});
