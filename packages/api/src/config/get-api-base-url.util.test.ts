// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { API_SERVER_PORT, CONFIG } from './config.constants.ts';
import { getApiBaseUrl } from './get-api-base-url.util.ts';

const originalEnvApiUrl = import.meta.env.VITE_API_URL;

/**
 * Deliberately a host no other branch of the function can produce, so an
 * assertion against it cannot be satisfied by the branch it is meant to rule
 * out. The override that hid this defect for two rounds of review was
 * `http://localhost:3001/api` — byte-identical to `CONFIG.localhost.apiHost`,
 * which is what a local request URL resolves to (#705).
 */
const OVERRIDE_API_URL = 'https://api.override.test/api';

const LOCAL_SSR_REQUEST_URL = 'http://localhost:5173/orders';
const DEPLOYED_SSR_REQUEST_URL = 'https://app.example.com/orders';

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    // Every assertion below now depends on whether the variable is set, because
    // it is priority 1 — so state the precondition rather than inheriting it
    // from whatever the runner's env happens to hold.
    Reflect.deleteProperty(import.meta.env, 'VITE_API_URL');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();

    if (originalEnvApiUrl === undefined) {
      Reflect.deleteProperty(import.meta.env, 'VITE_API_URL');
      return;
    }

    import.meta.env.VITE_API_URL = originalEnvApiUrl;
  });

  it('returns the localhost API host for localhost and private request URLs', () => {
    expect(getApiBaseUrl('http://localhost:5173/orders')).toBe(
      CONFIG.localhost.apiHost,
    );
    expect(getApiBaseUrl('http://192.168.1.25:5173/orders')).toBe(
      CONFIG.localhost.apiHost,
    );
  });

  it('uses the request URL origin for non-local hosts', () => {
    expect(getApiBaseUrl('https://app.example.com/orders')).toBe(
      'https://app.example.com/api',
    );
  });

  it('ignores an invalid request URL and falls through', () => {
    vi.stubGlobal('window', undefined);

    expect(getApiBaseUrl('not a valid url')).toBe(CONFIG.localhost.apiHost);
  });

  it('prefers VITE_API_URL when no request URL is provided', () => {
    import.meta.env.VITE_API_URL = OVERRIDE_API_URL;

    expect(getApiBaseUrl()).toBe(OVERRIDE_API_URL);
  });

  describe('precedence: VITE_API_URL outranks the request URL', () => {
    it('is a decision this test exists to pin, so the two answers must differ', () => {
      // Without this, the assertions below could pass on either ordering — the
      // exact failure that let the old order survive a review, a verification
      // and a round of fixes (#705).
      expect(OVERRIDE_API_URL).not.toBe(CONFIG.localhost.apiHost);
      expect(getApiBaseUrl(LOCAL_SSR_REQUEST_URL)).toBe(
        CONFIG.localhost.apiHost,
      );
      expect(getApiBaseUrl(DEPLOYED_SSR_REQUEST_URL)).toBe(
        'https://app.example.com/api',
      );
    });

    it('returns the override for a local SSR request URL', () => {
      import.meta.env.VITE_API_URL = OVERRIDE_API_URL;

      expect(getApiBaseUrl(LOCAL_SSR_REQUEST_URL)).toBe(OVERRIDE_API_URL);
    });

    it('returns the override for a deployed SSR request URL', () => {
      import.meta.env.VITE_API_URL = OVERRIDE_API_URL;

      expect(getApiBaseUrl(DEPLOYED_SSR_REQUEST_URL)).toBe(OVERRIDE_API_URL);
    });

    it('answers the same host to both halves of a render', () => {
      // The invariant the old order broke: a loader passes a request URL and
      // the browser does not, so ranking it first sent one page to two hosts.
      import.meta.env.VITE_API_URL = OVERRIDE_API_URL;

      expect(getApiBaseUrl(LOCAL_SSR_REQUEST_URL)).toBe(getApiBaseUrl());
    });

    it('leaves the request URL in charge when no override was built in', () => {
      // The other direction of the same order: priority 1 must not swallow
      // priority 2 when the variable is absent or bare.
      import.meta.env.VITE_API_URL = '';

      expect(getApiBaseUrl(DEPLOYED_SSR_REQUEST_URL)).toBe(
        'https://app.example.com/api',
      );

      Reflect.deleteProperty(import.meta.env, 'VITE_API_URL');

      expect(getApiBaseUrl(DEPLOYED_SSR_REQUEST_URL)).toBe(
        'https://app.example.com/api',
      );
    });
  });

  it('falls back to the localhost API host during SSR when no request URL is provided', () => {
    vi.stubGlobal('window', undefined);

    expect(getApiBaseUrl()).toBe(CONFIG.localhost.apiHost);
  });

  it('falls back to the localhost API host when `window` is absent entirely', () => {
    // `vi.stubGlobal('window', undefined)` above still *defines* the property.
    // Real SSR does not define it at all, so cover that shape too — the two
    // differ under an `in` check, and only this one matches production Node.
    Reflect.deleteProperty(globalThis, 'window');

    expect(getApiBaseUrl()).toBe(CONFIG.localhost.apiHost);
  });

  it('uses the Vite proxy on the client in development', () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('window', {} as Window);
    vi.stubGlobal('location', {
      hostname: 'app.example.com',
      protocol: 'https:',
    } as Location);

    expect(getApiBaseUrl()).toBe('/api');
  });

  it('uses the current private IP and API server port on the client in production', () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('window', {} as Window);
    vi.stubGlobal('location', {
      hostname: '192.168.1.25',
      protocol: 'http:',
    } as Location);

    expect(getApiBaseUrl()).toBe(`http://192.168.1.25:${API_SERVER_PORT}/api`);
  });

  it('uses the current public hostname on the client in production', () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('window', {} as Window);
    vi.stubGlobal('location', {
      hostname: 'app.example.com',
      protocol: 'https:',
    } as Location);

    expect(getApiBaseUrl()).toBe('https://app.example.com/api');
  });
});
