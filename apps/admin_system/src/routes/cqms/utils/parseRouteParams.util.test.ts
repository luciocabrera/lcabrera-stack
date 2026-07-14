import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseRouteParams } from './parseRouteParams.util';

const schema = z.object({ projectId: z.string().uuid() });

describe('parseRouteParams', () => {
  it('returns the validated params when they match the schema', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';

    const result = parseRouteParams({
      invalidMessage: 'Invalid project id.',
      params: { projectId },
      schema,
    });

    expect(result).toEqual({ projectId });
  });

  it('throws a 400 response when the params do not match', () => {
    try {
      parseRouteParams({
        invalidMessage: 'Invalid project id.',
        params: { projectId: 'not-a-uuid' },
        schema,
      });
      expect.unreachable('parseRouteParams should have thrown');
    } catch (error) {
      expect(error).toMatchObject({
        data: 'Invalid project id.',
        init: { status: 400 },
      });
    }
  });
});
