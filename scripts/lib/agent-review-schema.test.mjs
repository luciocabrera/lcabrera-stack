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
  // Every row of §2.2 that states a property beyond "a string is present". A
  // spec asserting an invariant its own validator does not check is the failure
  // §1 of the contract exists to prevent, and it stays invisible until someone
  // writes the document that breaks it.
  const nonBlocking = (id) => ({
    ...BLOCKING_FINDING,
    id,
    refutation: undefined,
    severity: 'medium',
  });

  it('reports error for two findings sharing an id', () => {
    // §6's override names a finding BY id — `- f1 — wrong: …` — and is built so
    // that a finding the comment does not name still blocks. Two findings
    // called `f1` make an override ambiguous about which one it discharges.
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
    // The same wording, the same table. Step 6 reports unmet criteria by id, so
    // duplicates make its own message ambiguous too.
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
    // An `omission` finding's file is never matched against the diff, so
    // nothing else would catch this — and a reader following an absolute path
    // out of the repository is what the row exists to prevent.
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
