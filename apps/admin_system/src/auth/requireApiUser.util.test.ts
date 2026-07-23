import { verifyApiToken } from '@repo/scan-ingestion/queries/verifyApiToken.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { requireApiUser } from './requireApiUser.util';

vi.mock('@repo/scan-ingestion/queries/verifyApiToken.util', () => ({
  verifyApiToken: vi.fn(),
}));

const makeRequest = (authHeader?: string) =>
  new Request('http://localhost/_action/push-snapshot/p', {
    headers: authHeader === undefined ? {} : { Authorization: authHeader },
    method: 'POST',
  });

describe('requireApiUser', () => {
  beforeEach(() => {
    vi.mocked(verifyApiToken).mockReset();
  });

  it('returns the owning userId for a valid Bearer token', async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({ userId: 'user-1' });

    const result = await requireApiUser({
      request: makeRequest('Bearer cqms_abc.def'),
    });

    expect(result).toEqual({ userId: 'user-1' });
    expect(verifyApiToken).toHaveBeenCalledWith('cqms_abc.def');
  });

  it('throws 401 when the Authorization header is missing', async () => {
    await expect(
      requireApiUser({ request: makeRequest() }),
    ).rejects.toMatchObject({ init: { status: 401 } });
    expect(verifyApiToken).not.toHaveBeenCalled();
  });

  it('throws 401 for a non-Bearer header', async () => {
    await expect(
      requireApiUser({ request: makeRequest('Basic xyz') }),
    ).rejects.toMatchObject({ init: { status: 401 } });
  });

  it('accepts a lower-cased scheme, which RFC 7235 makes case-insensitive', async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({ userId: 'user-1' });

    await requireApiUser({ request: makeRequest('bearer cqms_abc.def') });

    expect(verifyApiToken).toHaveBeenCalledWith('cqms_abc.def');
  });

  it('tolerates surrounding whitespace around the token', async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({ userId: 'user-1' });

    await requireApiUser({ request: makeRequest('Bearer   cqms_abc.def  ') });

    expect(verifyApiToken).toHaveBeenCalledWith('cqms_abc.def');
  });

  it('throws 401 for a scheme with no token after it', async () => {
    // The input class that made the old regex backtrack quadratically: a
    // long whitespace run with nothing to capture at the end of it.
    const schemeWithoutToken = `Bearer${' '.repeat(50)}`;

    await expect(
      requireApiUser({ request: makeRequest(schemeWithoutToken) }),
    ).rejects.toMatchObject({ init: { status: 401 } });
    expect(verifyApiToken).not.toHaveBeenCalled();
  });

  it('throws 401 when the token is invalid', async () => {
    vi.mocked(verifyApiToken).mockResolvedValue(undefined);

    await expect(
      requireApiUser({ request: makeRequest('Bearer bad') }),
    ).rejects.toMatchObject({ init: { status: 401 } });
  });
});
