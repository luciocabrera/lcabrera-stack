import { describe, expect, it, vi } from "vitest";

import { resolveFromCacheOrFetch } from "./resolveFromCacheOrFetch.util.ts";

describe("resolveFromCacheOrFetch", () => {
  it("returns cache.data when skip matches and data exists (cache HIT)", async () => {
    const fetchFn = vi.fn();
    const cache = { data: "cached-response", promise: undefined, skip: 50 };

    const result = await resolveFromCacheOrFetch({
      cache,
      expectedSkip: 50,
      fetchFn,
    });

    expect(result).toBe("cached-response");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("awaits cache.promise when skip matches and promise exists (cache IN-FLIGHT)", async () => {
    const fetchFn = vi.fn();
    const cache = {
      data: undefined,
      promise: Promise.resolve("in-flight-response"),
      skip: 50,
    };

    const result = await resolveFromCacheOrFetch({
      cache,
      expectedSkip: 50,
      fetchFn,
    });

    expect(result).toBe("in-flight-response");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("calls fetchFn when skip does not match (cache MISS)", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-response");
    const cache = { data: "stale-data", promise: undefined, skip: 100 };

    const result = await resolveFromCacheOrFetch({
      cache,
      expectedSkip: 50,
      fetchFn,
    });

    expect(result).toBe("fresh-response");
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("calls fetchFn when cache is undefined", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fallback-response");

    const result = await resolveFromCacheOrFetch({
      cache: undefined,
      expectedSkip: 0,
      fetchFn,
    });

    expect(result).toBe("fallback-response");
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("prefers data over promise when both exist on a matching cache", async () => {
    const fetchFn = vi.fn();
    const cache = {
      data: "data-value",
      promise: Promise.resolve("promise-value"),
      skip: 10,
    };

    const result = await resolveFromCacheOrFetch({
      cache,
      expectedSkip: 10,
      fetchFn,
    });

    expect(result).toBe("data-value");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("calls fetchFn when cache has matching skip but neither data nor promise", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fetched");
    const cache = { data: undefined, promise: undefined, skip: 50 };

    const result = await resolveFromCacheOrFetch({
      cache,
      expectedSkip: 50,
      fetchFn,
    });

    expect(result).toBe("fetched");
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});
