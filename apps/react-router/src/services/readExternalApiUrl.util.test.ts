import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { readExternalApiUrl } from './readExternalApiUrl.util';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('readExternalApiUrl', () => {
  it('is undefined when the app was built without an override', () => {
    vi.stubEnv('VITE_API_URL', undefined);

    expect(readExternalApiUrl()).toBeUndefined();
  });

  it('treats an empty value as no override', () => {
    // A shell exporting the variable bare would otherwise select the external
    // path and then resolve every request against an origin of `''`.
    vi.stubEnv('VITE_API_URL', '');

    expect(readExternalApiUrl()).toBeUndefined();
  });

  it('returns the host the app was built to talk to', () => {
    vi.stubEnv('VITE_API_URL', 'http://override.example:9999/api');

    expect(readExternalApiUrl()).toBe('http://override.example:9999/api');
  });
});
