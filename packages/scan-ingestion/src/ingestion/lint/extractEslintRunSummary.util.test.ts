import { describe, expect, it } from 'vitest';

import { eslintRawSchema } from './eslintRaw.schema.ts';
import { extractEslintRunSummary } from './extractEslintRunSummary.util.ts';

describe('extractEslintRunSummary', () => {
  it('aggregates counts across files and counts distinct active rules only', () => {
    const raw = eslintRawSchema.parse({
      results: [
        {
          errorCount: 2,
          filePath: '/repo/a.ts',
          fixableErrorCount: 1,
          messages: [
            { message: 'm1', ruleId: 'rule-a', severity: 2 },
            { message: 'm2', ruleId: 'rule-a', severity: 2 },
          ],
          suppressedMessages: [
            {
              message: 's1',
              ruleId: 'rule-suppressed',
              severity: 1,
              suppressions: [{ justification: '', kind: 'file' }],
            },
          ],
          warningCount: 0,
        },
        {
          errorCount: 0,
          filePath: '/repo/b.ts',
          fixableWarningCount: 1,
          messages: [{ message: 'm3', ruleId: 'rule-b', severity: 1 }],
          warningCount: 1,
        },
      ],
    });

    expect(extractEslintRunSummary({ raw })).toEqual({
      error_count: 2,
      fatal_error_count: 0,
      files_linted: 2,
      fixable_error_count: 1,
      fixable_warning_count: 1,
      rules_violated_count: 2,
      suppressed_count: 1,
      warning_count: 1,
    });
  });

  it('returns zeros for an empty result set', () => {
    const raw = eslintRawSchema.parse({ results: [] });

    expect(extractEslintRunSummary({ raw })).toEqual({
      error_count: 0,
      fatal_error_count: 0,
      files_linted: 0,
      fixable_error_count: 0,
      fixable_warning_count: 0,
      rules_violated_count: 0,
      suppressed_count: 0,
      warning_count: 0,
    });
  });
});
