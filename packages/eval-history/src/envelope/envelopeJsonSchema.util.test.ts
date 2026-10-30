import { describe, expect, it } from 'vite-plus/test';

import { adjudicationEnvelopeSchema } from './adjudicationEnvelope.schema.ts';
import { envelopeJsonSchema } from './envelopeJsonSchema.util.ts';

describe('envelopeJsonSchema', () => {
  it('describes the input a reader outside TypeScript validates', () => {
    const schema = envelopeJsonSchema();

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.required).toEqual([
      'run',
      'schema_version',
      'subjects',
      'tasks',
      'trials',
    ]);
  });

  it('describes the schema it is given in place of the run envelope', () => {
    expect(envelopeJsonSchema(adjudicationEnvelopeSchema).required).toEqual([
      'case',
      'outcome',
      'schema_version',
      'verifiers',
    ]);
  });
});
