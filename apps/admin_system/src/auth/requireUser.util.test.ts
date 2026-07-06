import { describe, expect, it } from 'vitest';

import { requireUser } from './requireUser.util';

// The session-validated happy path needs a live cqms_db (getUserById) and
// is covered by packages/scan-ingestion's real-DB tests plus the live
// login E2E (ADR-017) — here we pin the pure gate behavior: no session →
// redirect to /login carrying the original destination.

type ExpectLoginRedirectArgs = {
  readonly expectedRedirectTo: string;
  readonly request: Request;
};

const expectLoginRedirect = async ({
  expectedRedirectTo,
  request,
}: ExpectLoginRedirectArgs): Promise<void> => {
  try {
    await requireUser({ request });
    expect.unreachable('requireUser should have thrown a redirect');
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    const response = error as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      `/login?redirectTo=${encodeURIComponent(expectedRedirectTo)}`,
    );
  }
};

describe('requireUser', () => {
  it('redirects an unauthenticated request to /login with the destination', async () => {
    await expectLoginRedirect({
      expectedRedirectTo: '/cqms/projects',
      request: new Request('http://localhost/cqms/projects'),
    });
  });

  it('preserves the query string in redirectTo', async () => {
    await expectLoginRedirect({
      expectedRedirectTo: '/cqms/projects/view/abc?tab=runs',
      request: new Request('http://localhost/cqms/projects/view/abc?tab=runs'),
    });
  });

  it('redirects when the cookie is not a valid session', async () => {
    await expectLoginRedirect({
      expectedRedirectTo: '/cqms/projects',
      request: new Request('http://localhost/cqms/projects', {
        headers: { Cookie: '__cqms_session=garbage' },
      }),
    });
  });
});
