import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vite-plus/test';

import {
  agentTools,
  describeTooledJudgement,
  expectedVerdict,
  hasGateProof,
  judgeTooledFixture,
  nextAdrNumber,
  tooledDispatch,
  tooledRunCount,
  withAdrNumber,
} from './tooled-fixtures.mjs';

const PROOF = [
  '## Gate proof',
  'Criterion: 2',
  'Plant:     removed the value > max test',
  'Failed:    vp run --filter @lcabrera/utils test → exit 1',
  '           1 failed',
  'Reverted:  git status --porcelain → empty',
  'Passed:    vp run --filter @lcabrera/utils test → exit 0',
].join('\n');

const report = ({ verdict, rows, proof = PROOF }) =>
  [
    `VERDICT: ${verdict}`,
    '',
    '## Criteria',
    '| # | Criterion | Outcome | Method | Falsifier looked for |',
    '|---|---|---|---|---|',
    ...rows.map(
      ([n, outcome]) => `| ${n} | c${n} | ${outcome} | gate | looked |`,
    ),
    '',
    proof,
  ].join('\n');

const allMet = [1, 2, 3, 4, 5].map((n) => [n, 'met']);
const withNotMet = (broken) =>
  allMet.map(([n]) => [n, n === broken ? 'not-met' : 'met']);

describe('agentTools', () => {
  it("reads the verifier's real tool list", () => {
    const definition = readFileSync(
      new URL('../../.claude/agents/refactor-verifier.md', import.meta.url),
      'utf8',
    );
    expect(agentTools(definition)).toEqual([
      'Bash',
      'Read',
      'Write',
      'Edit',
      'Glob',
      'Grep',
    ]);
  });

  it('reads a definition with CRLF line endings', () => {
    expect(
      agentTools('---\r\nname: x\r\ntools:\r\n  - Bash\r\n---\r\nbody'),
    ).toEqual(['Bash']);
  });

  it('refuses a definition that lists no tools', () => {
    expect(() => agentTools('---\nname: x\n---\nbody')).toThrow('no tools');
  });
});

describe('ADR renumbering', () => {
  it('takes the number after the highest ADR, ignoring other files', () => {
    expect(
      nextAdrNumber([
        'ADR-007-a.md',
        'ADR-129-b.md',
        'README.md',
        '_TEMPLATE.md',
      ]),
    ).toBe(130);
    expect(nextAdrNumber([])).toBe(1);
  });

  it('renames every mention of the fixture ADR, padded to three digits', () => {
    expect(
      withAdrNumber({
        diff: '+++ b/docs/decisions/ADR-130-x.md\n+See ADR-130.',
        number: 131,
      }),
    ).toBe('+++ b/docs/decisions/ADR-131-x.md\n+See ADR-131.');
  });
});

describe('tooledDispatch', () => {
  it('names the worktree, the base commit and the branch, and carries the issue and diff', () => {
    const text = tooledDispatch({
      base: 'abc123',
      branch: 'eval/clean',
      diff: '+line',
      issue: '## 6. Acceptance Criteria',
      worktree: '/tmp/wt',
    });
    expect(text).toContain(
      'Certify the change in /tmp/wt against issue #9999.',
    );
    expect(text).toContain('Base: abc123    Branch: eval/clean');
    expect(text).toContain('## 6. Acceptance Criteria');
    expect(text).toContain('```diff\n+line\n```');
    expect(text).toContain('Post nothing');
  });
});

describe('hasGateProof', () => {
  it('needs a failing run and a passing run of the gate', () => {
    expect(hasGateProof(PROOF)).toBe(true);
    expect(hasGateProof(PROOF.replace('exit 1', 'exit 0'))).toBe(false);
    expect(hasGateProof(PROOF.replace(/^Passed:.*$/m, ''))).toBe(false);
    expect(hasGateProof('## Gate proof\nnone')).toBe(false);
  });
});

describe('expectedVerdict', () => {
  it('is PASS for a fixture with nothing planted, FAIL otherwise', () => {
    expect(expectedVerdict([])).toBe('PASS');
    expect(expectedVerdict([3])).toBe('FAIL');
  });
});

describe('judgeTooledFixture', () => {
  const judge = (expectedNotMet, runs) =>
    judgeTooledFixture({ expectedNotMet, fixture: 'f', runs });

  it('passes clean work only on a plain PASS with a gate proof', () => {
    expect(
      judge([], [{ report: report({ rows: allMet, verdict: 'PASS' }) }])
        .matched,
    ).toBe(true);
    expect(
      judge(
        [],
        [
          {
            report: report({ rows: allMet, verdict: 'PASS (inspection-only)' }),
          },
        ],
      ).matched,
    ).toBe(false);
    expect(
      judge(
        [],
        [{ report: report({ proof: '', rows: allMet, verdict: 'PASS' }) }],
      ).matched,
    ).toBe(false);
  });

  it('passes a violation only on FAIL with exactly its planted criterion', () => {
    expect(
      judge([2], [{ report: report({ rows: withNotMet(2), verdict: 'FAIL' }) }])
        .matched,
    ).toBe(true);
    expect(
      judge([2], [{ report: report({ rows: withNotMet(3), verdict: 'FAIL' }) }])
        .matched,
    ).toBe(false);
    expect(
      judge([2], [{ report: report({ rows: withNotMet(2), verdict: 'PASS' }) }])
        .matched,
    ).toBe(false);
  });

  it('fails a run that errored or left a changed tree, whatever its report says', () => {
    const good = report({ rows: allMet, verdict: 'PASS' });
    expect(
      judge(
        [],
        [{ error: 'the session ended with error_max_turns', report: good }],
      ).matched,
    ).toBe(false);
    expect(
      judge(
        [],
        [{ report: good, treeProblem: 'the worktree is dirty: M a.ts' }],
      ).matched,
    ).toBe(false);
    expect(judge([], []).matched).toBe(false);
  });

  it('marks runs that disagree', () => {
    const judgement = judge(
      [2],
      [
        { report: report({ rows: withNotMet(2), verdict: 'FAIL' }) },
        { report: report({ rows: withNotMet(4), verdict: 'FAIL' }) },
      ],
    );
    expect(judgement.stable).toBe(false);
  });
});

describe('describeTooledJudgement', () => {
  it('prints each run and the outcome', () => {
    const judgement = judgeTooledFixture({
      expectedNotMet: [],
      fixture: 'clean',
      runs: [{ report: report({ rows: allMet, verdict: 'PASS' }) }],
    });
    expect(describeTooledJudgement(judgement)).toBe(
      'clean: not-met [], verdict PASS, gate proof yes -> ok',
    );
  });
});

describe('tooledRunCount', () => {
  it('accepts one or more, and refuses anything else', () => {
    expect(tooledRunCount('1')).toBe(1);
    expect(() => tooledRunCount('0')).toThrow('at least 1');
    expect(() => tooledRunCount('two')).toThrow('at least 1');
  });
});
