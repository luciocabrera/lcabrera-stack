import type { z } from 'zod';

import { schemaSamples } from './schemaSamples.util.ts';

type MarkedSamplesArgs = Omit<Parameters<typeof schemaSamples>[0], 'path'>;

export const markedSamples = (args: MarkedSamplesArgs) =>
  schemaSamples(args).map((sample) => (args.schema as z.ZodType).parse(sample));
