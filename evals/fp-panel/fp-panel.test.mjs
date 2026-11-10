import { runEnvelopeSchema } from '@repo/eval-history/envelope/envelope.schema';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { hashLines } from '../../scripts/lib/false-positive-markers.mjs';
import { readFixtureTree, writeCaseTree } from './case-tree.mjs';
import {
  agentPath,
  caseIdOf,
  casePathOf,
  fixtureCaseFile,
  panelSubject,
  panelTask,
  panelTrial,
  promptHashOf,
  runCount,
  seatLine,
  seatScore,
  selectedFixtures,
  suiteExitCode,
  treePathOf,
} from './fp-panel.mjs';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const read = (path) => readFileSync(here(path), 'utf8');

const EXPECTED = JSON.parse(read('./expected.json'));

const FIXTURES = Object.keys(EXPECTED);

const fixtureOf = (name) => ({
  files: readFixtureTree(here(`./cases/${name}/tree`)),
  finding: JSON.parse(read(`./cases/${name}/finding.json`)),
});

const OK = { matched: true, verdict: 'REAL' };

const scratch = [];

afterEach(() => {
  for (const directory of scratch.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('the fp-panel fixtures', () => {
  it('hold both true answers, so a prompt that always answers one fails', () => {
    expect(new Set(Object.values(EXPECTED))).toEqual(
      new Set(['FALSE_POSITIVE', 'REAL']),
    );
  });

  it.each(FIXTURES)(
    '%s flags lines its tree holds, under the name the finding uses',
    (name) => {
      const { files, finding } = fixtureOf(name);
      const lines = files[finding.file]?.split('\n') ?? [];
      const caseFile = fixtureCaseFile({
        caseId: 'FP-9001',
        finding,
        text: files[finding.file],
      });

      expect(finding.end).toBeGreaterThanOrEqual(finding.start);
      expect(lines.length).toBeGreaterThanOrEqual(finding.end);
      expect(caseFile.case.content_hash).toBe(
        hashLines(lines.slice(finding.start - 1, finding.end)),
      );
      expect(caseFile.code.context).toContain(lines[finding.start - 1]);
    },
  );

  it('differ between the used and unused export only in the importer', () => {
    const used = fixtureOf('used-export');
    const unused = fixtureOf('unused-export');

    expect(used.finding).toEqual(unused.finding);
    expect(
      Object.keys(used.files).filter(
        (path) => used.files[path] !== unused.files[path],
      ),
    ).toEqual(['src/view.ts']);
    expect(used.files['src/view.ts']).toContain('formatLabel');
    expect(unused.files['src/view.ts']).not.toContain('formatLabel');
  });
});

describe('fixtureCaseFile', () => {
  it('builds the case a panel reads, holding nothing but the finding and its code', () => {
    const { files, finding } = fixtureOf('nested-ternary');
    const caseFile = fixtureCaseFile({
      caseId: 'FP-9002',
      finding,
      text: files[finding.file],
    });

    expect(
      Object.keys(caseFile).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual([
      'case',
      'code',
      'completion',
      'explain',
      'finding',
      'schema_version',
      'trace',
    ]);
    expect(caseFile.case).toMatchObject({
      analyzer: 'oxlint',
      case_id: 'FP-9002',
      file: 'src/rateTone.ts',
      finding_id: 'src/rateTone.ts:4:unicorn/no-nested-ternary',
      pr: null,
      rule: 'unicorn/no-nested-ternary',
    });
    expect(caseFile.finding).toEqual(finding.records);
  });
});

describe('selectedFixtures', () => {
  const expected = { a: 'FALSE_POSITIVE', b: 'REAL' };

  it('numbers every fixture in name order, whichever are selected', () => {
    expect(selectedFixtures({ expected, names: [] })).toEqual([
      { caseId: 'FP-9001', fixture: 'a', truth: 'FALSE_POSITIVE' },
      { caseId: 'FP-9002', fixture: 'b', truth: 'REAL' },
    ]);
    expect(selectedFixtures({ expected, names: ['b'] })).toEqual([
      { caseId: 'FP-9002', fixture: 'b', truth: 'REAL' },
    ]);
  });

  it('refuses a fixture that does not exist, naming the ones that do', () => {
    expect(() => selectedFixtures({ expected, names: ['c'] })).toThrow(
      'no fp-panel fixture named c; the fixtures are a, b',
    );
  });
});

describe('the small helpers', () => {
  it('names the agent, the case and the tree path', () => {
    expect(agentPath('adversary')).toBe('.claude/agents/fp-adversary.md');
    expect(caseIdOf(0)).toBe('FP-9001');
    expect(casePathOf('FP-9001')).toBe(
      'docs/agents/adjudications/FP-9001/case.json',
    );
    expect(treePathOf('src/a.ts.fixture')).toBe('src/a.ts');
    expect(treePathOf('README.md')).toBeUndefined();
  });

  it('takes one run or more', () => {
    expect(runCount('1')).toBe(1);
    expect(() => runCount('0')).toThrow(
      '--runs must be a whole number of at least 1',
    );
  });
});

describe('seatScore', () => {
  it('passes a seat that reaches the true verdict', () => {
    expect(
      seatScore({ parsed: { verdict: 'REAL' }, truth: 'REAL' }),
    ).toStrictEqual({ error: undefined, ...OK });
  });

  it('fails a seat that reaches the other verdict', () => {
    expect(
      seatScore({ parsed: { verdict: 'FALSE_POSITIVE' }, truth: 'REAL' }),
    ).toStrictEqual({
      error: undefined,
      matched: false,
      verdict: 'FALSE_POSITIVE',
    });
  });

  it('fails a malformed verdict without a verdict, and keeps a session error', () => {
    expect(
      seatScore({ parsed: { problem: 'line one is "MAYBE"' }, truth: 'REAL' }),
    ).toStrictEqual({ error: undefined, matched: false, verdict: null });
    expect(
      seatScore({
        error: 'the session ended with error_max_turns',
        parsed: { verdict: 'REAL' },
        truth: 'REAL',
      }),
    ).toStrictEqual({
      error: 'the session ended with error_max_turns',
      matched: false,
      verdict: null,
    });
  });
});

const DEFINITION = '---\nname: fp-judge\n---\nJudge the case.\n';

const task = (systemPrompt) =>
  panelTask({
    fixture: 'used-export',
    promptHash: promptHashOf({ dispatch: 'Read it.', systemPrompt }),
    role: 'judge',
    tree: { 'src/a.ts': 'export const a = 1;\n' },
    truth: 'FALSE_POSITIVE',
  });

const session = (score, problem) => ({ problem, score });

describe('the envelope records', () => {
  it('moves the task prompt hash when the prompt changes, and only then', () => {
    expect(task('Judge the case.').agent_prompt_hash).toBe(
      task('Judge the case.').agent_prompt_hash,
    );
    expect(task('Judge the case.').agent_prompt_hash).not.toBe(
      task('Judge the case, and always dismiss it.').agent_prompt_hash,
    );
  });

  it('builds an envelope the eval-history schema accepts', () => {
    const trial = panelTrial({
      fixture: 'used-export',
      metrics: { duration_ms: 1000 },
      queuedAt: Date.parse('2026-11-01T00:00:00.000Z'),
      role: 'judge',
      score: { error: undefined, matched: false, verdict: 'REAL' },
      transcript: null,
      trialIndex: 0,
      truth: 'FALSE_POSITIVE',
    });
    const envelope = JSON.parse(
      read('../../packages/eval-history/src/envelope/fixtures/fp-panel.json'),
    );

    expect(trial).toMatchObject({
      detail: {
        fixture: 'used-export',
        matched: false,
        role: 'judge',
        schema: 'fp-panel/1',
        truth: 'FALSE_POSITIVE',
        verdict: 'REAL',
      },
      outcome: 'fail',
      task_key: 'fp-panel/used-export/judge',
    });
    expect(
      runEnvelopeSchema.safeParse({
        ...envelope,
        subjects: [panelSubject({ definition: DEFINITION, role: 'judge' })],
        tasks: [task('Judge the case.')],
        trials: [{ ...envelope.trials[0], detail: trial.detail }],
      }).success,
    ).toBe(true);
  });
});

describe('the run summary', () => {
  it('passes a seat only when every run reached the true verdict', () => {
    expect(
      seatLine({
        fixture: 'used-export',
        role: 'judge',
        sessions: [session(OK), session(OK)],
        truth: 'REAL',
      }),
    ).toBe('used-export judge: REAL | REAL -> ok');
    expect(
      seatLine({
        fixture: 'used-export',
        role: 'adversary',
        sessions: [
          session({ error: 'the session ended with error_max_turns' }),
          session({ matched: false, verdict: null }, 'line one is "MAYBE"'),
          session({ matched: false, verdict: null }),
        ],
        truth: 'REAL',
      }),
    ).toBe(
      'used-export adversary: error: the session ended with error_max_turns | malformed: line one is "MAYBE" | malformed: no verdict -> FAIL (expected REAL in every run)',
    );
  });

  it('exits 1 when any seat missed', () => {
    expect(suiteExitCode([session(OK)])).toBe(0);
    expect(
      suiteExitCode([
        session(OK),
        session({ matched: false, verdict: 'REAL' }),
      ]),
    ).toBe(1);
  });
});

describe('writeCaseTree', () => {
  it('lays out the fixture files and the case file where a seat looks for them', () => {
    const into = mkdtempSync(join(tmpdir(), 'fp-panel-test-'));
    scratch.push(into);
    const { files } = fixtureOf('used-export');

    writeCaseTree({
      caseFile: { case: { case_id: 'FP-9001' } },
      casePath: casePathOf('FP-9001'),
      files,
      into,
    });

    expect(readFixtureTree(here('./cases/used-export/tree'))).toEqual(files);
    expect(readFileSync(join(into, 'src/view.ts'), 'utf8')).toBe(
      files['src/view.ts'],
    );
    const written = readFileSync(join(into, casePathOf('FP-9001')), 'utf8');

    expect(JSON.parse(written)).toEqual({ case: { case_id: 'FP-9001' } });
  });
});
