// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_SERVER_PORT, CONFIG } from '../api.constants';

import { getApiBaseUrl } from './api.util';

const originalEnvApiUrl = import.meta.env.VITE_API_URL;

describe('getApiBaseUrl', () => {
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

  it('falls back to VITE_API_URL when the request URL is invalid', () => {
    import.meta.env.VITE_API_URL = 'https://api.example.com/custom';

    expect(getApiBaseUrl('not a valid url')).toBe(
      'https://api.example.com/custom',
    );
  });

  it('prefers VITE_API_URL when no request URL is provided', () => {
    import.meta.env.VITE_API_URL = 'https://api.example.com/custom';

    expect(getApiBaseUrl()).toBe('https://api.example.com/custom');
  });

  it('falls back to the localhost API host during SSR when no request URL is provided', () => {
    vi.stubGlobal('window', undefined);

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
