import type { ActionFunctionArgs } from 'react-router';

import { issueApiToken } from '@repo/scan-ingestion/queries/issueApiToken.util';
import { revokeApiToken } from '@repo/scan-ingestion/queries/revokeApiToken.util';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireUser } from '@/auth/requireUser.util';

import { action } from './accountTokens.action';

vi.mock('@/auth/requireUser.util', () => ({ requireUser: vi.fn() }));
vi.mock('@repo/scan-ingestion/queries/issueApiToken.util', () => ({
  issueApiToken: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/revokeApiToken.util', () => ({
  revokeApiToken: vi.fn(),
}));

const USER_ID = 'a1b2c3d4-0000-4000-8000-0000000000ff';

const invoke = (entries: Readonly<Record<string, string>>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return action({
    context: {},
    params: {},
    request: new Request('https://cqms.example/cqms/account/tokens', {
      body: formData,
      method: 'POST',
    }),
  } as unknown as ActionFunctionArgs);
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(requireUser).mockResolvedValue({
    id: USER_ID,
    username: 'ada',
  } as Awaited<ReturnType<typeof requireUser>>);
  vi.mocked(issueApiToken).mockResolvedValue({
    plaintext: 'cqms_abc.def',
  } as Awaited<ReturnType<typeof issueApiToken>>);
  vi.mocked(revokeApiToken).mockResolvedValue(undefined);
});

describe('accountTokens action', () => {
  // The plaintext is returned exactly once, for the page to show (ADR-029).
  it('issues a token for the acting user and returns the plaintext once', async () => {
    const result = await invoke({ intent: 'token-issue', name: 'ci-laptop' });

    expect(issueApiToken).toHaveBeenCalledWith({
      name: 'ci-laptop',
      userId: USER_ID,
    });
    expect(result).toEqual({ plaintext: 'cqms_abc.def' });
  });

  it('refuses an unnamed token without issuing one', async () => {
    const result = await invoke({ intent: 'token-issue', name: '' });

    expect(result).toEqual({ tokenError: 'Name the token.' });
    expect(issueApiToken).not.toHaveBeenCalled();
  });

  it('revokes a token for the acting user', async () => {
    const result = await invoke({ intent: 'token-revoke', tokenId: 'tok-1' });

    expect(revokeApiToken).toHaveBeenCalledWith({
      tokenId: 'tok-1',
      userId: USER_ID,
    });
    expect(result).toEqual({ ok: true });
  });

  it('refuses a revoke with no token id', async () => {
    const result = await invoke({ intent: 'token-revoke', tokenId: '' });

    expect(result).toEqual({ tokenError: 'Invalid token.' });
    expect(revokeApiToken).not.toHaveBeenCalled();
  });

  it('rejects an unknown intent without touching either mutation', async () => {
    const result = await invoke({ intent: 'token-steal' });

    expect(result).toEqual({ tokenError: 'Unknown intent.' });
    expect(issueApiToken).not.toHaveBeenCalled();
    expect(revokeApiToken).not.toHaveBeenCalled();
  });

  it("renders the DB's ownership rejection inline rather than as a 500", async () => {
    vi.mocked(revokeApiToken).mockRejectedValue(
      new Error('token belongs to another user'),
    );

    const result = await invoke({ intent: 'token-revoke', tokenId: 'tok-1' });

    expect(result).toEqual({ tokenError: 'token belongs to another user' });
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    vi.mocked(issueApiToken).mockRejectedValue('pg exploded');

    const result = await invoke({ intent: 'token-issue', name: 'ci-laptop' });

    expect(result).toEqual({ tokenError: 'Token operation failed.' });
  });

  it('authenticates before doing anything', async () => {
    vi.mocked(requireUser).mockRejectedValue(new Error('Redirect to /login'));

    await expect(
      invoke({ intent: 'token-issue', name: 'ci-laptop' }),
    ).rejects.toThrow('Redirect to /login');
    expect(issueApiToken).not.toHaveBeenCalled();
  });
});
