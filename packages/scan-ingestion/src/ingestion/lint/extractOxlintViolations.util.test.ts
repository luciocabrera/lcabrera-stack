import { describe, expect, it } from 'vitest';

import { extractOxlintViolations } from './extractOxlintViolations.util.ts';
import { oxlintRawSchema } from './oxlintRaw.schema.ts';

describe('extractOxlintViolations', () => {
  it('maps diagnostics with scope-resolved, project-root-relative paths', () => {
    const raw = oxlintRawSchema.parse({
      diagnostics: [
        {
          code: 'eslint(no-unused-vars)',
          filename: 'src/foo.ts',
          help: 'Remove the variable.',
          labels: [{ span: { column: 7, line: 12 } }],
          message: "'x' is declared but never used.",
          severity: 'warning',
          url: 'https://example.test/no-unused-vars',
        },
      ],
      number_of_files: 3,
      number_of_rules: 90,
    });

    const violations = extractOxlintViolations({
      raw,
      scopeValue: 'packages/ui',
      targetRootPath: '/repo',
    });

    expect(violations).toEqual([
      {
        col: 7,
        file_path: 'packages/ui/src/foo.ts',
        finding_id: expect.any(String),
        fixable: false,
        help_url: 'https://example.test/no-unused-vars',
        line: 12,
        message: "'x' is declared but never used.",
        rule_id: 'eslint(no-unused-vars)',
        severity: 'MEDIUM',
        severity_raw: 'warning',
        source: 'oxlint',
        suggestion_text: 'Remove the variable.',
        suppressed: false,
      },
    ]);
  });

  it('maps error severity to HIGH and handles whole-repo scope', () => {
    const raw = oxlintRawSchema.parse({
      diagnostics: [
        {
          code: 'typescript(no-non-null-assertion)',
          filename: 'src/bar.ts',
          message: 'Forbidden non-null assertion.',
          severity: 'error',
        },
      ],
    });

    const violations = extractOxlintViolations({
      raw,
      scopeValue: '.',
      targetRootPath: '/repo',
    });

    expect(violations[0]).toMatchObject({
      file_path: 'src/bar.ts',
      severity: 'HIGH',
      severity_raw: 'error',
    });
  });

  it('handles absolute filenames and missing spans', () => {
    const raw = oxlintRawSchema.parse({
      diagnostics: [
        {
          filename: '/repo/src/abs.ts',
          message: 'Something.',
          severity: 'warning',
        },
      ],
    });

    const violations = extractOxlintViolations({
      raw,
      scopeValue: '.',
      targetRootPath: '/repo',
    });

    expect(violations[0]).toMatchObject({
      col: undefined,
      file_path: 'src/abs.ts',
      line: undefined,
      rule_id: 'oxlint(unknown)',
      suggestion_text: 'Address per rule: oxlint(unknown).',
    });
  });
});
