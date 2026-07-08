import { describe, expect, it } from 'vitest';

import { eslintRawSchema } from './eslintRaw.schema.ts';
import { extractEslintViolations } from './extractEslintViolations.util.ts';

const LOCAL_PATH = '/repo';

describe('extractEslintViolations', () => {
  it('maps active messages with project-root-relative paths and canonical severity', () => {
    const raw = eslintRawSchema.parse({
      results: [
        {
          filePath: '/repo/apps/web/src/foo.ts',
          messages: [
            {
              column: 5,
              endColumn: 12,
              endLine: 3,
              line: 3,
              message: 'Unexpected any.',
              messageId: 'unexpectedAny',
              ruleId: '@typescript-eslint/no-explicit-any',
              severity: 2,
            },
          ],
        },
      ],
    });

    const violations = extractEslintViolations({ localPath: LOCAL_PATH, raw });

    expect(violations).toEqual([
      {
        col: 5,
        end_col: 12,
        end_line: 3,
        file_path: 'apps/web/src/foo.ts',
        finding_id: expect.any(String),
        fixable: false,
        line: 3,
        message: 'Unexpected any.',
        message_id: 'unexpectedAny',
        rule_id: '@typescript-eslint/no-explicit-any',
        severity: 'HIGH',
        severity_raw: '2',
        source: 'eslint',
        suggestion_text:
          'Address per rule: @typescript-eslint/no-explicit-any.',
        suppressed: false,
        suppression_justification: undefined,
        suppression_kind: undefined,
      },
    ]);
  });

  it('uses the real suggestion description as suggestion_text when eslint provides one', () => {
    const raw = eslintRawSchema.parse({
      results: [
        {
          filePath: '/repo/src/num.ts',
          messages: [
            {
              message: 'Prefer `Number.isSafeInteger()`.',
              ruleId: 'unicorn/prefer-number-is-safe-integer',
              severity: 2,
              suggestions: [
                {
                  desc: 'Replace `Number.isInteger()` with `Number.isSafeInteger()`.',
                  fix: { range: [349, 358], text: 'isSafeInteger' },
                },
              ],
            },
          ],
        },
      ],
    });

    const violations = extractEslintViolations({ localPath: LOCAL_PATH, raw });

    expect(violations[0]?.suggestion_text).toBe(
      'Replace `Number.isInteger()` with `Number.isSafeInteger()`.',
    );
  });

  it('includes suppressedMessages as suppressed rows with kind and justification', () => {
    const raw = eslintRawSchema.parse({
      results: [
        {
          filePath: '/repo/src/bar.ts',
          messages: [],
          suppressedMessages: [
            {
              line: 10,
              message: 'Do not use null.',
              ruleId: 'unicorn/no-null',
              severity: 1,
              suppressions: [
                { justification: 'baselined debt', kind: 'directive' },
              ],
            },
          ],
        },
      ],
    });

    const violations = extractEslintViolations({ localPath: LOCAL_PATH, raw });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      severity: 'MEDIUM',
      suppressed: true,
      suppression_justification: 'baselined debt',
      suppression_kind: 'directive',
    });
  });

  it('marks messages carrying a fix payload as fixable', () => {
    const raw = eslintRawSchema.parse({
      results: [
        {
          filePath: '/repo/src/baz.ts',
          messages: [
            {
              fix: { range: [0, 5], text: 'fixed' },
              message: 'Sort imports.',
              ruleId: 'perfectionist/sort-imports',
              severity: 2,
            },
          ],
        },
      ],
    });

    const violations = extractEslintViolations({ localPath: LOCAL_PATH, raw });

    expect(violations[0]?.fixable).toBe(true);
    expect(violations[0]?.suggestion_text).toBe(
      'Autofixable via `eslint --fix` (rule: perfectionist/sort-imports).',
    );
  });

  it('falls back to eslint(unknown) for a missing ruleId (fatal parse errors)', () => {
    // Real eslint emits `ruleId: null` for fatal errors; JSON.parse of the
    // raw artifact yields the same shape as omitting the key here.
    const raw = eslintRawSchema.parse({
      results: [
        {
          filePath: '/repo/src/broken.ts',
          messages: [{ message: 'Parsing error.', severity: 2 }],
        },
      ],
    });

    const violations = extractEslintViolations({ localPath: LOCAL_PATH, raw });

    expect(violations[0]?.rule_id).toBe('eslint(unknown)');
  });
});
