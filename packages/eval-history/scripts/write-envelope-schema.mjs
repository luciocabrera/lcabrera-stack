/**
 * Writes `src/envelope/envelope.schema.json` and
 * `src/envelope/adjudication.schema.json` from their Zod schemas, so a reader
 * outside TypeScript validates against the same shapes the writers produce
 * (ADR-131). `envelope.schema.test.ts` and `adjudicationEnvelope.schema.test.ts`
 * fail while either file is stale.
 *
 * Usage: vp run --filter @repo/eval-history schema:write, then vp fmt .
 * Exit codes: 0 written; non-zero when a write throws.
 */
import { writeFile } from 'node:fs/promises';

import { adjudicationEnvelopeSchema } from '../src/envelope/adjudicationEnvelope.schema.ts';
import { envelopeJsonSchema } from '../src/envelope/envelopeJsonSchema.util.ts';

const write = (file, schema) =>
  writeFile(
    new URL(`../src/envelope/${file}`, import.meta.url),
    `${JSON.stringify(envelopeJsonSchema(schema), undefined, 2)}\n`,
  );

await write('envelope.schema.json');
await write('adjudication.schema.json', adjudicationEnvelopeSchema);
