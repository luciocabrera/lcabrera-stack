import { afterEach, describe, expect, it, vi } from "vitest";

import { readPersistedStateFromCookie } from "./readPersistedStateFromCookie.util.ts";

vi.mock("@/utils/storage", () => ({
  readFromCookie: vi.fn(),
}));

import { readFromCookie } from "@/utils/storage";

describe("readPersistedStateFromCookie", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty object when no cookies found", () => {
    vi.mocked(readFromCookie).mockReturnValue(undefined);
    const result = readPersistedStateFromCookie({ persistenceKey: "myTable" });
    expect(result).toEqual({});
  });

  it("reads and parses a sorting slice", () => {
    const value = JSON.stringify({
      value: [{ columnKey: "name", direction: "asc" }],
      version: 1,
    });
    vi.mocked(readFromCookie).mockImplementation(({ key }) => {
      if (key.endsWith("-sorting")) return encodeURIComponent(value);
      return undefined;
    });
    const result = readPersistedStateFromCookie({ persistenceKey: "myTable" });
    expect(result.sorting).toEqual([{ columnKey: "name", direction: "asc" }]);
  });

  it("converts columnVisibility array to Set", () => {
    const value = JSON.stringify({ value: ["id", "name"], version: 1 });
    vi.mocked(readFromCookie).mockImplementation(({ key }) => {
      if (key.endsWith("-columnVisibility")) return encodeURIComponent(value);
      return undefined;
    });
    const result = readPersistedStateFromCookie({ persistenceKey: "myTable" });
    expect(result.columnVisibility).toBeInstanceOf(Set);
    expect((result.columnVisibility as Set<string>).has("id")).toBe(true);
  });

  it("skips slices with wrong version", () => {
    const value = JSON.stringify({
      value: [{ columnKey: "name", direction: "asc" }],
      version: 99,
    });
    vi.mocked(readFromCookie).mockImplementation(({ key }) => {
      if (key.endsWith("-sorting")) return encodeURIComponent(value);
      return undefined;
    });
    const result = readPersistedStateFromCookie({ persistenceKey: "myTable" });
    expect(result.sorting).toBeUndefined();
  });

  it("skips slices with invalid JSON", () => {
    vi.mocked(readFromCookie).mockImplementation(({ key }) => {
      if (key.endsWith("-sorting")) return encodeURIComponent("not-json");
      return undefined;
    });
    const result = readPersistedStateFromCookie({ persistenceKey: "myTable" });
    expect(result.sorting).toBeUndefined();
  });

  it("passes cookieString to readFromCookie", () => {
    vi.mocked(readFromCookie).mockReturnValue(undefined);
    readPersistedStateFromCookie({
      cookieString: "foo=bar",
      persistenceKey: "myTable",
    });
    expect(vi.mocked(readFromCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ cookieString: "foo=bar" }),
    );
  });
});
