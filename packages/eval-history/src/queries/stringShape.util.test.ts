import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { stringShape } from './stringShape.util.ts';

const UUID_SAMPLE = '00000000-0000-4000-8000-000000000000';

describe('stringShape', () => {
  it.each([
    { label: 'a plain string', schema: z.string() },
    { label: 'a length-bounded string', schema: z.string().min(1).max(40) },
    {
      label: 'a pattern that admits prose',
      schema: z.string().regex(/^[a-z ]+$/u),
    },
    {
      label: 'an unanchored hex pattern',
      schema: z.string().regex(/[0-9a-f]{64}/u),
    },
    {
      label: 'an open-ended hex pattern',
      schema: z.string().regex(/^[0-9a-f]{4}.*$/u),
    },
    { label: 'an e-mail address', schema: z.email() },
  ])('calls $label free', ({ schema }) => {
    expect(stringShape(schema)).toEqual({ kind: 'free' });
  });

  it.each([
    {
      label: 'a sha256',
      sample: '0'.repeat(64),
      schema: z.string().regex(/^[0-9a-f]{64}$/u),
    },
    {
      label: 'a git sha',
      sample: '0'.repeat(40),
      schema: z.string().regex(/^[0-9a-f]{40}$/u),
    },
    { label: 'a uuid', sample: UUID_SAMPLE, schema: z.uuid() },
    { label: 'a v4 uuid', sample: UUID_SAMPLE, schema: z.uuidv4() },
    { label: 'a guid', sample: UUID_SAMPLE, schema: z.guid() },
    {
      label: 'an ISO timestamp',
      sample: '2026-01-01T00:00:00.000Z',
      schema: z.iso.datetime(),
    },
  ])('calls $label closed, with a sample it accepts', ({ sample, schema }) => {
    expect(stringShape(schema)).toEqual({ kind: 'closed', sample });
    expect(schema.parse(sample)).toBe(sample);
  });
});
