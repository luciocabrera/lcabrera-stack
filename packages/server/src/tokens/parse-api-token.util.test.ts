import { describe, expect, it } from 'vite-plus/test';

import { generateApiToken } from './generate-api-token.util.ts';
import { parseApiToken } from './parse-api-token.util.ts';

describe('parseApiToken', () => {
  it('round-trips a generated token with a prefix', () => {
    const { plaintext, secret, tokenId } = generateApiToken({ prefix: 'x_' });

    expect(parseApiToken({ plaintext, prefix: 'x_' })).toEqual({
      secret,
      tokenId,
    });
  });

  it('round-trips with no prefix', () => {
    const { plaintext, secret, tokenId } = generateApiToken();

    expect(parseApiToken({ plaintext })).toEqual({ secret, tokenId });
  });

  it('returns undefined when the prefix does not match', () => {
    expect(
      parseApiToken({ plaintext: 'y_abc.def', prefix: 'x_' }),
    ).toBeUndefined();
  });

  it('returns undefined without a separator', () => {
    expect(parseApiToken({ plaintext: 'abc123def' })).toBeUndefined();
  });

  it('returns undefined for an empty tokenId half', () => {
    expect(parseApiToken({ plaintext: '.secret' })).toBeUndefined();
  });

  it('returns undefined for an empty secret half', () => {
    expect(parseApiToken({ plaintext: 'tokenid.' })).toBeUndefined();
  });

  it('splits on the first separator only', () => {
    expect(parseApiToken({ plaintext: 'abc.def.ghi' })).toEqual({
      secret: 'def.ghi',
      tokenId: 'abc',
    });
  });
});
