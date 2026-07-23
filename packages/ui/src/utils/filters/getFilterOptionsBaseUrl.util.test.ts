import { describe, expect, it, vi } from 'vite-plus/test';

import { getFilterOptionsBaseUrl } from './getFilterOptionsBaseUrl.util';

vi.mock('@lcabrera/api/config/get-api-base-url.util', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001/api'),
}));

describe('getFilterOptionsBaseUrl', () => {
  it('resolves the bff transport to the API distinct endpoint', () => {
    expect(getFilterOptionsBaseUrl('bff')).toBe(
      'http://localhost:3001/api/distinct',
    );
  });

  it('resolves the loader transport to the same-origin resource route', () => {
    expect(getFilterOptionsBaseUrl('loader')).toBe('/_api/filter-options');
  });
});
