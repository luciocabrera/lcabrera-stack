import { describe, expect, it } from 'vite-plus/test';

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
});
