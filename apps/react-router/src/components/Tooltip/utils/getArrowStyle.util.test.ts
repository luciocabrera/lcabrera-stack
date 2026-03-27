import { describe, expect, it } from "vitest";

import { getArrowStyle } from "./getArrowStyle.util.ts";

describe("getArrowStyle", () => {
  it("returns horizontal arrow style for top placement", () => {
    const result = getArrowStyle("top", 20);
    expect(result).toBeDefined();
  });

  it("returns horizontal arrow style for bottom placement", () => {
    const result = getArrowStyle("bottom", 20);
    expect(result).toBeDefined();
  });

  it("returns vertical arrow style for left placement", () => {
    const result = getArrowStyle("left", 20);
    expect(result).toBeDefined();
  });

  it("returns vertical arrow style for right placement", () => {
    const result = getArrowStyle("right", 20);
    expect(result).toBeDefined();
  });

  it("top and left return different styles", () => {
    const top = getArrowStyle("top", 20);
    const left = getArrowStyle("left", 20);
    expect(top).not.toBe(left);
  });
});
