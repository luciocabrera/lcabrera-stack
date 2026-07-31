import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { getFirstIssueMessage } from './getFirstIssueMessage.util';

const schema = z.object({
  granteeUserId: z.uuid('Pick a user.'),
});

describe('getFirstIssueMessage', () => {
  it("returns the failed field's message", () => {
    const parsed = schema.safeParse({ granteeUserId: 'not-a-uuid' });

    expect(
      parsed.success ||
        getFirstIssueMessage({ error: parsed.error, fallback: 'Invalid.' }),
    ).toBe('Pick a user.');
  });

  it('returns the first message when several fields fail', () => {
    const parsed = z
      .object({
        a: z.string({ error: 'A required.' }),
        b: z.string({ error: 'B required.' }),
      })
      .safeParse({});

    expect(
      parsed.success ||
        getFirstIssueMessage({ error: parsed.error, fallback: 'Invalid.' }),
    ).toBe('A required.');
  });
});
