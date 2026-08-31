import { describe, expect, it } from 'vite-plus/test';

import { isEnterpriseOrdersResponse } from './isEnterpriseOrdersResponse.util';

describe('isEnterpriseOrdersResponse', () => {
  it('accepts a first page carrying a total', () => {
    expect(
      isEnterpriseOrdersResponse({ data: [], hasMore: true, total: 500 }),
    ).toBe(true);
  });

  it('accepts a load-more page with no total (#402)', () => {
    expect(isEnterpriseOrdersResponse({ data: [], hasMore: false })).toBe(true);
  });

  it('rejects a non-numeric total rather than treating it as absent', () => {
    expect(
      isEnterpriseOrdersResponse({ data: [], hasMore: true, total: '500' }),
    ).toBe(false);
  });

  it('rejects a payload with no rows array', () => {
    expect(isEnterpriseOrdersResponse({ hasMore: true })).toBe(false);
  });

  it('rejects a payload with no hasMore flag', () => {
    expect(isEnterpriseOrdersResponse({ data: [] })).toBe(false);
  });

  it.each([undefined, JSON.parse('null'), 'page', 42, []])(
    'rejects %p',
    (value) => {
      expect(isEnterpriseOrdersResponse(value)).toBe(false);
    },
  );
});
