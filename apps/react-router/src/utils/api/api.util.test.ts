// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import { CONFIG } from '@/constants/api.constants';

import { getApiBaseUrl } from './api.util';

const originalEnvApiUrl = import.meta.env.VITE_API_URL;

describe('getApiBaseUrl', () => {
  afterEach(() => {
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
});
