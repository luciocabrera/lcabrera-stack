import { describe, expect, it } from 'vite-plus/test';

import { signAuthPayload } from './signAuthPayload.server';

describe('signAuthPayload', () => {
  it('is deterministic for the same payload and secret', () => {
    const args = { payload: 'abc', secret: 'top-secret' };

    expect(signAuthPayload(args)).toBe(signAuthPayload(args));
  });

  it('produces a hex string', () => {
    const signature = signAuthPayload({ payload: 'abc', secret: 's' });

    expect(signature).toMatch(/^[0-9a-f]+$/);
  });

  it('changes when the payload changes', () => {
    const secret = 's';

    expect(signAuthPayload({ payload: 'a', secret })).not.toBe(
      signAuthPayload({ payload: 'b', secret }),
    );
  });

  it('changes when the secret changes', () => {
    const payload = 'a';

    expect(signAuthPayload({ payload, secret: 's1' })).not.toBe(
      signAuthPayload({ payload, secret: 's2' }),
    );
  });
});
