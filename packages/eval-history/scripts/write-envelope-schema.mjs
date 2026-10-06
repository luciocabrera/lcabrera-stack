/**
 * Writes `src/envelope/envelope.schema.json` from the Zod envelope schema, so a
 * reader outside TypeScript validates against the same shape the runners write
 * (ADR-131). `envelope.schema.test.ts` fails while the file is stale.
 *
 * Usage: vp run --filter @repo/eval-history schema:write, then vp fmt .
 * Exit codes: 0 written; non-zero when the write throws.
 */
import { writeFile } from 'node:fs/promises';

import { envelopeJsonSchema } from '../src/envelope/envelopeJsonSchema.util.ts';

const target = new URL('../src/envelope/envelope.schema.json', import.meta.url);

await writeFile(
  target,
  `${JSON.stringify(envelopeJsonSchema(), undefined, 2)}\n`,
);
