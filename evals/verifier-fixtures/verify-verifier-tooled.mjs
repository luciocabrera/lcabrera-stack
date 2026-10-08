#!/usr/bin/env node
import { query } from '@anthropic-ai/claude-agent-sdk';
/**
 * Runs the refactor-verifier with its own tools against each fixture applied
 * in a scratch worktree, one fixture at a time, and checks the report: clean
 * work earns a plain PASS, each violation a FAIL on its planted criterion, and
 * every report carries a fail-to-pass gate proof. A run whose worktree or main
 * checkout changed fails too.
 *
 * Each run also writes a run envelope under .tmp/eval-results/verifier-tooled/.
 *
 * Usage (from the repo root): vp run evals:verifier:tooled [-- <fixture> ...] [--runs <n>] [--keep]
 * Needs a Claude login and the local database the full quality gate uses.
 * Exit codes: 0 = every fixture matched, 1 = otherwise, 130/143 = interrupted.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  chunk,
  errorText,
  finalResult,
  runBatches,
  sessionMetrics,
  sessionProblem,
  timedDrain,
  withoutSeparator,
} from '../agent-sessions.mjs';
import { runSettings } from '../run-envelope.mjs';
import {
  recordRun,
  runIdentity,
  runnerHarnessVersion,
  sdkVersion,
} from '../run-record.mjs';
import {
  agentTools,
  describeTooledJudgement,
  judgeTooledFixture,
  readTooledRun,
  tooledDispatch,
  tooledRunCount,
  tooledRunCounts,
} from './tooled-fixtures.mjs';
import { cleanUp, git, prepare, treeProblem } from './tooled-worktree.mjs';
import {
  agentPromptHash,
  CONTRACT_PATH,
  fixtureTask,
  tooledTrial,
  verifierSubject,
} from './verifier-envelope.mjs';
import { agentBody, suiteEnd } from './verifier-fixtures.mjs';

const MODEL = 'claude-opus-5-5';
const SUITE = 'verifier-tooled';
const MAX_TURNS = 200;
const REPO_ROOT = resolve('.');
const REPORT_DIR = join(REPO_ROOT, '.tmp', 'verifier-evals-tooled');
const BLOCKED = ['Bash(git commit:*)', 'Bash(git push:*)', 'Bash(gh:*)'];

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const certify = async ({
  dispatch,
  queuedAt,
  systemPrompt,
  tools,
  worktree,
}) => {
  const { error, messages, timestamps } = await timedDrain({
    open: () =>
      query({
        options: {
          allowDangerouslySkipPermissions: true,
          cwd: worktree,
          disallowedTools: BLOCKED,
          maxTurns: MAX_TURNS,
          mcpServers: {},
          model: MODEL,
          permissionMode: 'bypassPermissions',
          persistSession: false,
          settingSources: ['project'],
          strictMcpConfig: true,
          systemPrompt,
          tools,
        },
        prompt: dispatch,
      }),
    queuedAt,
  });
  return {
    error: error ?? sessionProblem(messages, tools),
    metrics: sessionMetrics(messages, timestamps, error),
    report: finalResult(messages)?.result ?? '',
  };
};

const runOnce = async ({ fixture, index, keep, queuedAt, shared }) => {
  const branch = `eval/verifier-tooled/${fixture}-${Date.now()}-${index}`;
  const before = git(['status', '--porcelain']);
  const worktree = mkdtempSync(join(tmpdir(), 'verifier-tooled-'));
  try {
    const prepared = prepare({
      base: shared.base,
      branch,
      diff: read(`./${fixture}/change.diff`),
      worktree,
    });
    const dispatch = tooledDispatch({
      ...shared,
      branch,
      diff: prepared.applied,
      worktree,
    });
    const run = await certify({ ...shared, dispatch, queuedAt, worktree });
    return {
      ...run,
      treeProblem: treeProblem({ before, head: prepared.head, worktree }),
    };
  } catch (error) {
    return {
      error: `setup failed: ${errorText(error)}`,
      report: '',
      setupFailed: true,
    };
  } finally {
    cleanUp({ branch, keep, worktree });
  }
};

const runText = ({ error, report, treeProblem: problem }) =>
  [...[error, problem].filter(Boolean).map((note) => `(${note})`), report].join(
    '\n\n',
  );

const save = ({ fixture, runs }) => {
  for (const [index, run] of runs.entries()) {
    writeFileSync(join(REPORT_DIR, `${fixture}-${index + 1}.md`), runText(run));
  }
};

const recordOnce = ({
  expectedNotMet,
  fixture,
  index,
  queuedAt,
  record,
  result,
}) => {
  const run = readTooledRun(result);
  record.addTrial(
    tooledTrial({
      expectedNotMet,
      fixture,
      matched: tooledRunCounts({ expectedNotMet, run }),
      metrics: result.metrics,
      queuedAt,
      run,
      setupFailed: result.setupFailed === true,
      transcript: record.transcript({
        name: `${fixture}-${index + 1}.md`,
        text: runText(result),
      }),
      trialIndex: index,
    }),
  );
  return result;
};

const runFixture = async ({
  expected,
  fixture,
  keep,
  record,
  runs,
  shared,
}) => {
  const results = await runBatches(
    chunk(
      Array.from({ length: runs }, (_, index) => {
        const queuedAt = Date.now();
        return async () =>
          recordOnce({
            expectedNotMet: expected[fixture],
            fixture,
            index,
            queuedAt,
            record,
            result: await runOnce({ fixture, index, keep, queuedAt, shared }),
          });
      }),
      1,
    ),
  );
  save({ fixture, runs: results });
  return results;
};

const judgeAndPrint = async ({
  expected,
  fixture,
  keep,
  record,
  runs,
  shared,
}) => {
  const results = await runFixture({
    expected,
    fixture,
    keep,
    record,
    runs,
    shared,
  });
  const judgement = judgeTooledFixture({
    expectedNotMet: expected[fixture],
    fixture,
    runs: results,
  });
  console.log(describeTooledJudgement(judgement));
  return judgement;
};

const selected = ({ expected, names }) => {
  const unknown = names.filter((name) => !Object.hasOwn(expected, name));
  if (unknown.length > 0) {
    throw new Error(`no fixture named ${unknown.join(', ')} in expected.json`);
  }
  return names.length === 0 ? Object.keys(expected) : names;
};

const tooledPlan = ({ definition, expected, fixtures, runs, shared }) => {
  const promptHash = agentPromptHash({
    files: [{ bytes: read(`../../${CONTRACT_PATH}`), path: CONTRACT_PATH }],
    systemPrompt: shared.systemPrompt,
  });
  return {
    harnessVersion: runnerHarnessVersion(import.meta.url),
    modelId: MODEL,
    sdkVersion: sdkVersion(),
    settings: runSettings({
      argv: process.argv.slice(2),
      concurrency: 1,
      maxTurns: MAX_TURNS,
      runs,
      selection: fixtures,
      tools: shared.tools,
    }),
    subjects: [verifierSubject(definition)],
    suite: SUITE,
    tasks: fixtures.map((fixture) =>
      fixtureTask({
        agentPromptHash: promptHash,
        diff: read(`./${fixture}/change.diff`),
        expectedNotMet: expected[fixture],
        fixture,
        issue: shared.issue,
        suite: SUITE,
      }),
    ),
  };
};

const runSuite = async ({ expected, fixtures, keep, record, runs, shared }) => {
  const judgements = await runBatches(
    chunk(
      fixtures.map(
        (fixture) => () =>
          judgeAndPrint({ expected, fixture, keep, record, runs, shared }),
      ),
      1,
    ),
  );
  const { exitCode, footer } = suiteEnd({ judgements, reportDir: REPORT_DIR });
  console.log(footer);
  process.exitCode = exitCode;
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: {
      keep: { type: 'boolean' },
      runs: { default: '1', type: 'string' },
    },
  });
  const expected = JSON.parse(read('./expected.json'));
  const fixtures = selected({ expected, names: positionals });
  const runs = tooledRunCount(values.runs);
  const definition = read('../../.claude/agents/refactor-verifier.md');
  const shared = {
    base: git(['rev-parse', 'main']),
    issue: read('./issue.md'),
    systemPrompt: agentBody(definition),
    tools: agentTools(definition),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  await recordRun({
    execute: (record) =>
      runSuite({ expected, fixtures, keep: values.keep, record, runs, shared }),
    identity: runIdentity(),
    plan: tooledPlan({ definition, expected, fixtures, runs, shared }),
  });
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
