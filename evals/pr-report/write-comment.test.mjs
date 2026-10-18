import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { passRateOf } from '../run-envelope.mjs';
import { COMMENT_MARKER, NO_ENVELOPE, NO_SUITE_RAN } from './comment-body.mjs';

const SCRIPT = fileURLToPath(new URL('write-comment.mjs', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BASE = JSON.parse(
  readFileSync(
    new URL(
      '../../packages/eval-history/src/envelope/fixtures/skills.json',
      import.meta.url,
    ),
    'utf8',
  ),
);

const SKILLS = ['react-19', 'store-pattern'];
const scratch = [];

const REGRESSION_CONFIG = JSON.parse(
  readFileSync(new URL('../regression.config.json', import.meta.url), 'utf8'),
);

const skillsEnvelope = ({ branch, outcomes, runId, startedAt }) => {
  const [subject] = BASE.subjects;
  const [task] = BASE.tasks;
  const [trial] = BASE.trials;
  const trials = SKILLS.flatMap((skill) =>
    outcomes.map((outcome, index) => ({
      ...trial,
      outcome,
      task_key: `skills/${skill}/trigger-1`,
      trial_index: index,
    })),
  );
  return {
    ...BASE,
    run: {
      ...BASE.run,
      branch,
      run_id: runId,
      started_at: startedAt,
      totals: {
        ...BASE.run.totals,
        pass_rate: passRateOf({ regressionConfig: REGRESSION_CONFIG, trials }),
        trials: trials.length,
      },
    },
    subjects: SKILLS.map((name) => ({
      ...subject,
      name,
      path: `.github/skills/${name}`,
    })),
    tasks: SKILLS.map((name) => ({
      ...task,
      subject: { kind: 'skill', name },
      task_key: `skills/${name}/trigger-1`,
    })),
    trials,
  };
};

const resultsDir = (envelopes) => {
  const directory = mkdtempSync(join(tmpdir(), 'eval-pr-report-'));
  scratch.push(directory);
  mkdirSync(join(directory, 'skills'));
  for (const envelope of envelopes) {
    writeFileSync(
      join(directory, 'skills', `${envelope.run.run_id}.json`),
      JSON.stringify(envelope),
    );
  }
  return directory;
};

const writeComment = (args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', RUNNER_TEMP: tmpdir() },
  });

const PR = skillsEnvelope({
  branch: 'feat/1-tighten-react-19',
  outcomes: ['pass', 'fail', 'fail'],
  runId: '0b6d35a4-6f43-4c71-9a52-0f6a9b9d2c01',
  startedAt: '2026-10-08T09:00:00.000Z',
});

const MAIN = skillsEnvelope({
  branch: 'main',
  outcomes: ['pass', 'pass', 'pass'],
  runId: '0b6d35a4-6f43-4c71-9a52-0f6a9b9d2c02',
  startedAt: '2026-10-07T09:00:00.000Z',
});

afterEach(() => {
  for (const directory of scratch.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('write-comment', () => {
  it('says no suite ran when no skill changed', () => {
    const { status, stdout } = writeComment(['--scope', 'none']);
    expect(status).toBe(0);
    expect(stdout.startsWith(COMMENT_MARKER)).toBe(true);
    expect(stdout).toContain(NO_SUITE_RAN);
  });

  it('compares the changed skill with main, with n and insufficient data', () => {
    const { status, stdout } = writeComment([
      '--scope',
      'some',
      '--skill',
      'react-19',
      '--pr-results',
      resultsDir([PR]),
      '--main-results',
      resultsDir([MAIN]),
    ]);
    expect(status).toBe(0);
    expect(stdout.startsWith(COMMENT_MARKER)).toBe(true);
    expect(stdout).toContain(`Compared with main's run \`${MAIN.run.run_id}\``);
    expect(stdout).toContain('Narrowed to `react-19`');
    expect(stdout).toContain('| skills/react-19/trigger-1 | 3/3 | 1/3 |');
    expect(stdout).toContain(
      'insufficient data (n=3, 3 passed) → insufficient data (n=3, 1 passed)',
    );
    expect(stdout).not.toContain('store-pattern');
  });

  it('gives the rate and its interval once there are enough trials', () => {
    const { stdout } = writeComment([
      '--scope',
      'all',
      '--pr-results',
      resultsDir([PR]),
      '--main-results',
      resultsDir([MAIN]),
    ]);
    expect(stdout).toMatch(
      /100\.0% \(n=6, [\d.]+%–100\.0%\) → 33\.3% \(n=6, /u,
    );
  });

  it.each([
    [
      ['pass', 'fail', 'fail'],
      'Pass rate: 33.3% (n=6, 2 passed; Wilson interval',
    ],
    [['pass', 'fail'], 'Pass rate: insufficient data (n=4, 2 passed'],
  ])(
    'reports the PR run alone when main has no complete run',
    (outcomes, line) => {
      const { status, stdout } = writeComment([
        '--scope',
        'all',
        '--pr-results',
        resultsDir([
          skillsEnvelope({
            ...PR.run,
            outcomes,
            runId: PR.run.run_id,
            startedAt: PR.run.started_at,
          }),
        ]),
        '--main-results',
        resultsDir([{ ...MAIN, run: { ...MAIN.run, status: 'partial' } }]),
      ]);
      expect(status).toBe(0);
      expect(stdout).toContain("so this is the pull request's run alone");
      expect(stdout).toContain(line);
    },
  );

  it('says the PR run alone is partial when the session limit cut it off', () => {
    const { stdout } = writeComment([
      '--scope',
      'all',
      '--pr-results',
      resultsDir([{ ...PR, run: { ...PR.run, status: 'partial' } }]),
      '--main-results',
      resultsDir([]),
    ]);
    expect(stdout).toContain("so this is the pull request's run alone");
    expect(stdout).toContain('This run is a partial run');
  });

  it('says so when the run left no envelope', () => {
    const { stdout } = writeComment([
      '--scope',
      'all',
      '--pr-results',
      resultsDir([]),
    ]);
    expect(stdout).toContain(NO_ENVELOPE);
  });

  it('refuses a results directory outside the repository and RUNNER_TEMP', () => {
    const { status, stderr } = writeComment([
      '--scope',
      'all',
      '--pr-results',
      '/etc',
    ]);
    expect(status).toBe(1);
    expect(stderr).toContain('refusing to read results outside');
  });

  it('refuses a selection that names no skill', () => {
    const { status, stderr } = writeComment(['--scope', 'some']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/^write-comment: /u);
  });
});
