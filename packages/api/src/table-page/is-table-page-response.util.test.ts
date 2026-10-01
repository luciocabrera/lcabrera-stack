import { describe, expect, it } from 'vite-plus/test';

import { isTablePageResponse } from './is-table-page-response.util.ts';

describe('isTablePageResponse', () => {
  it('accepts a first page carrying a total', () => {
    expect(isTablePageResponse({ data: [], hasMore: true, total: 500 })).toBe(
      true,
    );
  });

  it('accepts a load-more page with no total', () => {
    expect(isTablePageResponse({ data: [], hasMore: false })).toBe(true);
  });

  it('accepts a page carrying a tagged error and a tagged warning', () => {
    expect(
      isTablePageResponse({
        data: [],
        error: { kind: 'unexpected', message: 'No.' },
        groupingWarning: { kind: 'stats-unavailable' },
        hasMore: false,
        total: 0,
      }),
    ).toBe(true);
  });

  it('rejects a non-numeric total rather than treating it as absent', () => {
    expect(isTablePageResponse({ data: [], hasMore: true, total: '500' })).toBe(
      false,
    );
  });

  it.each(['error', 'groupingWarning'])('rejects an untagged %s', (field) => {
    expect(
      isTablePageResponse({ data: [], [field]: 'failed', hasMore: false }),
    ).toBe(false);
    expect(
      isTablePageResponse({ data: [], [field]: { kind: 1 }, hasMore: false }),
    ).toBe(false);
  });

  it('rejects a payload with no rows array', () => {
    expect(isTablePageResponse({ hasMore: true })).toBe(false);
  });

  it('rejects a payload with no hasMore flag', () => {
    expect(isTablePageResponse({ data: [] })).toBe(false);
  });

  it.each([undefined, JSON.parse('null'), 'page', 42, []])(
    'rejects %p',
    (value) => {
      expect(isTablePageResponse(value)).toBe(false);
    },
  );
});
