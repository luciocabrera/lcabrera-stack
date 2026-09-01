import { describe, expect, it } from 'vite-plus/test';

import {
  BLOCKING_FINDING,
  CRITERION,
  FILES,
  HEAD,
  PR,
  failDocument,
  passDocument,
  verdictBody as body,
} from './agent-review-fixtures.mjs';
import { validateVerdictBody } from './agent-review-validate.mjs';

const validate = (document, options = {}) =>
  validateVerdictBody(body(document), {
    files: FILES,
    headSha: HEAD,
    pr: PR,
    ...options,
  });

describe('validateVerdictBody — §2.2, the properties the table asserts', () => {
  const nonBlocking = (id) => ({
    ...BLOCKING_FINDING,
    id,
    refutation: undefined,
    severity: 'medium',
  });

  it('reports error for two findings sharing an id', () => {
    const result = validate(
      passDocument({ findings: [nonBlocking('f1'), nonBlocking('f1')] }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('more than once');
  });

  it('leaves findings with distinct ids alone', () => {
    expect(
      validate(
        passDocument({ findings: [nonBlocking('f1'), nonBlocking('f2')] }),
      ).state,
    ).toBe('pass');
  });

  it('reports error for two criteria sharing an id', () => {
    const result = validate(
      passDocument({
        criteria: [
          { ...CRITERION, id: '1' },
          { ...CRITERION, id: '1' },
        ],
      }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('more than once');
  });

  it('leaves criteria with distinct ids alone', () => {
    expect(
      validate(
        passDocument({
          criteria: [
            { ...CRITERION, id: '1' },
            { ...CRITERION, id: '2' },
          ],
        }),
      ).state,
    ).toBe('pass');
  });

  it('reports error for a `file` that is not repository-relative', () => {
    for (const file of ['/etc/passwd', '../outside.ts', 'a/../../b.ts']) {
      const result = validate(
        failDocument({
          findings: [
            {
              ...BLOCKING_FINDING,
              file,
              kind: 'omission',
              line: null,
              rule: 'AGENTS.md §5',
            },
          ],
        }),
      );
      expect(result.state, file).toBe('error');
      expect(result.errors[0], file).toContain('repository-relative');
    }
  });

  it('leaves an ordinary repository path alone', () => {
    expect(
      validate(
        failDocument({
          findings: [
            {
              ...BLOCKING_FINDING,
              file: 'packages/ui/src/components/Table/Table.tsx',
              kind: 'omission',
              line: null,
              rule: 'AGENTS.md §5',
            },
          ],
        }),
      ).state,
    ).toBe('fail');
  });
});
