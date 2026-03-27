import { describe, expect, it } from "vitest";

import { getShadowStyle } from "./getShadowStyle.util.ts";

describe("getShadowStyle", () => {
  it("returns undefined when pinInfo is undefined", () => {
    expect(getShadowStyle(undefined)).toBeUndefined();
  });

  it("returns left shadow style for last left-pinned column", () => {
    const result = getShadowStyle({
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 100,
      side: "left",
    });
    expect(result).toBeDefined();
  });

  it("returns right shadow style for first right-pinned column", () => {
    const result = getShadowStyle({
      isFirstPinnedRight: true,
      isLastPinnedLeft: false,
      offset: 0,
      side: "right",
    });
    expect(result).toBeDefined();
  });

  it("returns undefined when neither last-left nor first-right", () => {
    const result = getShadowStyle({
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: 0,
      side: "left",
    });
    expect(result).toBeUndefined();
  });
});
