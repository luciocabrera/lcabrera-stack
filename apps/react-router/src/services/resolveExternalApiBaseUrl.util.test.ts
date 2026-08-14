import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { resolveExternalApiBaseUrl } from './resolveExternalApiBaseUrl.util';

const SSR_REQUEST_URL = 'http://localhost:5173/car-sales';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveExternalApiBaseUrl', () => {
  it('returns the override even when an SSR request URL is supplied', () => {
    // The whole reason this util exists. `getApiBaseUrl` ranks `requestUrl`
    // first and would answer `http://localhost:3001/api` here, never reading
    // the variable at all.
    vi.stubEnv('VITE_API_URL', 'http://override.example:9999/api');

    expect(resolveExternalApiBaseUrl(SSR_REQUEST_URL)).toBe(
      'http://override.example:9999/api',
    );
  });

  it('returns the override in the browser, where there is no request URL', () => {
    vi.stubEnv('VITE_API_URL', 'http://override.example:9999/api');

    expect(resolveExternalApiBaseUrl()).toBe(
      'http://override.example:9999/api',
    );
  });

  it('answers the same host on both sides, which is the invariant that broke', () => {
    // SSR and the browser must agree; they disagreed before, because only one
    // of the two paths passed a `requestUrl`.
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/api');

    expect(resolveExternalApiBaseUrl(SSR_REQUEST_URL)).toBe(
      resolveExternalApiBaseUrl(),
    );
  });

  it('falls back to the package resolver when no override was built in', () => {
    vi.stubEnv('VITE_API_URL', undefined);

    expect(resolveExternalApiBaseUrl(SSR_REQUEST_URL)).toBe(
      'http://localhost:3001/api',
    );
  });

  it('treats an empty override as absent rather than as an empty origin', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(resolveExternalApiBaseUrl(SSR_REQUEST_URL)).toBe(
      'http://localhost:3001/api',
    );
  });
});
