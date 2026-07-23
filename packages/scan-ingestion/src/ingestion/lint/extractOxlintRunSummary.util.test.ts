import { describe, expect, it } from 'vite-plus/test';

import { extractOxlintRunSummary } from './extractOxlintRunSummary.util.ts';
import { oxlintRawSchema } from './oxlintRaw.schema.ts';

describe('extractOxlintRunSummary', () => {
  it('passes through oxc summary fields and splits severities', () => {
    const raw = oxlintRawSchema.parse({
      diagnostics: [
        { filename: 'a.ts', message: 'e1', severity: 'error' },
        { filename: 'b.ts', message: 'w1', severity: 'warning' },
        { filename: 'c.ts', message: 'w2', severity: 'warning' },
      ],
      number_of_files: 42,
      number_of_rules: 120,
    });

    expect(extractOxlintRunSummary({ raw })).toEqual({
      error_count: 1,
      number_of_files: 42,
      number_of_rules: 120,
      warning_count: 2,
    });
  });

  it('returns zeros for an empty run', () => {
    const raw = oxlintRawSchema.parse({});

    expect(extractOxlintRunSummary({ raw })).toEqual({
      error_count: 0,
      number_of_files: 0,
      number_of_rules: 0,
      warning_count: 0,
    });
  });
});
