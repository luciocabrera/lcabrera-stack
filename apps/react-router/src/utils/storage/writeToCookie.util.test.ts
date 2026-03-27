import { afterEach, describe, expect, it, vi } from "vitest";

import { writeToCookie } from "./writeToCookie.util.ts";

describe("writeToCookie", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appends Set-Cookie header when headers are provided", () => {
    const headers = new Headers();
    writeToCookie({ headers, key: "theme", value: "dark" });
    expect(headers.get("Set-Cookie")).toContain("theme=dark");
  });

  it("sets document.cookie when no headers provided", () => {
    let cookieValue = "";
    const docMock = { cookie: "" };
    Object.defineProperty(docMock, "cookie", {
      set: (val: string) => {
        cookieValue = val;
      },
      get: () => cookieValue,
    });
    vi.stubGlobal("document", docMock);

    writeToCookie({ key: "theme", value: "light" });
    expect(cookieValue).toContain("theme=light");
  });

  it("does nothing when document is undefined and no headers", () => {
    vi.stubGlobal("document", undefined);
    expect(() => writeToCookie({ key: "theme", value: "dark" })).not.toThrow();
  });
});
