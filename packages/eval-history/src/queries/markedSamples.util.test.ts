import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { trialDetailSchema } from '../envelope/envelope.schema.ts';
import { markedSamples } from './markedSamples.util.ts';

const MARKER = 'zz-marker';

describe('markedSamples', () => {
  it('returns samples the schema accepts, one per detail variant', () => {
    const samples = markedSamples({
      marker: MARKER,
      schema: trialDetailSchema,
      seedPaths: ['findings', 'summary'],
    });

    expect(samples.map((sample) => trialDetailSchema.parse(sample))).toEqual(
      samples,
    );
    expect(samples).toHaveLength(trialDetailSchema.options.length);
    expect(JSON.stringify(samples)).toContain(MARKER);
  });

  it('refuses a free field whose pattern the marker cannot satisfy', () => {
    expect(() =>
      markedSamples({
        marker: MARKER,
        schema: z.object({ note: z.string().regex(/^Note: .*$/u) }),
        seedPaths: ['note'],
      }),
    ).toThrow();
  });
});
