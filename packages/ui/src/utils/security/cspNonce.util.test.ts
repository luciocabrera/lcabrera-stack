import { describe, expect, it } from 'vitest';

import { getRequestCspNonce } from './cspNonce.util';

describe('cspNonce.util', () => {
  it('reads the standardized CSP nonce header', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-csp-nonce': 'nonce-123',
      },
    });

    expect(getRequestCspNonce(request)).toBe('nonce-123');
  });

  it('returns undefined when the nonce header is absent', () => {
    expect(
      getRequestCspNonce(new Request('https://example.com')),
    ).toBeUndefined();
  });
});
