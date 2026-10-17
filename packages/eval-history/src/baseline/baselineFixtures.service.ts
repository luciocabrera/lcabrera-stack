import { fileURLToPath } from 'node:url';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';

export const baselineFixtures = async () => {
  const fixtures = await readJsonFiles({
    directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
  });

  return {
    quality: runEnvelopeSchema.parse(fixtures.get('skill-quality.json')),
    rules: runEnvelopeSchema.parse(fixtures.get('rules-consistency.json')),
    skills: runEnvelopeSchema.parse(fixtures.get('skills.json')),
  };
};
