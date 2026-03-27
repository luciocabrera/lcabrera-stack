import { describe, expect, it } from "vitest";

import { buildCookieString } from "./buildCookieString.util.ts";

describe("buildCookieString", () => {
  it("builds a cookie string with the key and encoded value", () => {
    const result = buildCookieString({ key: "theme", value: "dark" });
    expect(result).toContain("theme=dark");
    expect(result).toContain("path=/");
    expect(result).toContain("SameSite=Lax");
  });

  it("URL-encodes special characters in value", () => {
    const result = buildCookieString({ key: "data", value: "hello world" });
    expect(result).toContain("data=hello%20world");
  });

  it("includes expires about 1 year in future", () => {
    const before = new Date();
    const result = buildCookieString({ key: "k", value: "v" });
    const after = new Date();

    const expiresMatch = /expires=([^;]+)/.exec(result);
    expect(expiresMatch).not.toBeNull();
    const expiresDate = new Date(expiresMatch![1]!);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Should be within 1 second of 1 year from now
    expect(Math.abs(expiresDate.getTime() - oneYearFromNow.getTime())).toBeLessThan(
      after.getTime() - before.getTime() + 1000,
    );
  });

  it("handles empty value", () => {
    const result = buildCookieString({ key: "k", value: "" });
    expect(result).toContain("k=");
  });
});
