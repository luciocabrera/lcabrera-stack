import { describe, expect, it } from 'vite-plus/test';

import { generateApiToken } from './generate-api-token.util.ts';

describe('generateApiToken', () => {
  it('joins the two halves with the supplied prefix', () => {
    const { plaintext, secret, tokenId } = generateApiToken({ prefix: 'x_' });

    expect(plaintext).toBe(`x_${tokenId}.${secret}`);
  });

  it('defaults to no prefix', () => {
    const { plaintext, secret, tokenId } = generateApiToken();

    expect(plaintext).toBe(`${tokenId}.${secret}`);
  });

  it('produces non-empty hex halves', () => {
    const { secret, tokenId } = generateApiToken();

    expect(tokenId).toMatch(/^[0-9a-f]+$/);
    expect(secret).toMatch(/^[0-9a-f]+$/);
  });

  it('is unique across calls', () => {
    const first = generateApiToken();
    const second = generateApiToken();

    expect(first.tokenId).not.toBe(second.tokenId);
    expect(first.secret).not.toBe(second.secret);
  });
});
