import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { isExternalApiEnabled } from './isExternalApiEnabled.util';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isExternalApiEnabled', () => {
  it('is off when VITE_API_URL is absent — the self-hosted default', () => {
    vi.stubEnv('VITE_API_URL', undefined);

    expect(isExternalApiEnabled()).toBe(false);
  });

  it('is off when VITE_API_URL is set but empty', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(isExternalApiEnabled()).toBe(false);
  });

  it('is on when VITE_API_URL names a host', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001/api');

    expect(isExternalApiEnabled()).toBe(true);
  });

  it('reads the variable per call rather than at import time', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(isExternalApiEnabled()).toBe(false);

    vi.stubEnv('VITE_API_URL', 'http://example.test/api');
    expect(isExternalApiEnabled()).toBe(true);
  });
});
