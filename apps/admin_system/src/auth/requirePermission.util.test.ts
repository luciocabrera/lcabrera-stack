import { describe, expect, it } from 'vite-plus/test';

import { requirePermission } from './requirePermission.util';

// The permission-checked path needs a live cqms_db (fn_assert_permission)
// and is covered by packages/scan-ingestion's real-DB tests plus the live
// viewer-403 E2E (ADR-024) — here we pin that the gate composes
// requireUser first: no session never reaches the permission check.

describe('requirePermission', () => {
  it('redirects an unauthenticated request to /login before any permission check', async () => {
    try {
      await requirePermission({
        action: 'read',
        request: new Request('http://localhost/cqms/admin/users'),
        resourceType: 'user',
      });
      expect.unreachable('requirePermission should have thrown a redirect');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(
        `/login?redirectTo=${encodeURIComponent('/cqms/admin/users')}`,
      );
    }
  });
});
