#!/usr/bin/env node
/**
 * Runs the refactor-verifier prompt, read verbatim from its agent definition,
 * over each fixture diff with no tools, and checks which criteria each report
 * marks not-met against the planted ones in expected.json. A run counts only
 * if its session held no tools, finished, and wrote a verdict line that is not
 * a PASS. Each fixture runs three times unless --runs says otherwise, never
 * fewer than twice, and runs that disagree fail.
 *
 * Each run also writes a run envelope under .tmp/eval-results/verifier-fixtures/.
 *
 * Usage (from the repo root): vp run evals:verifier [-- --runs <n>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every fixture matched and was stable, 1 = otherwise,
 * 130/143 = interrupted.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  chunk,
  costLine,
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
import { scrubSecrets } from '../transcript-scrub.mjs';

import {
  agentBody,
  describeJudgement,
  judgeFixture,
  readReport,
  renderDispatch,
  reportText,
  runCount,
  runCounts,
  suiteEnd,
} from './verifier-fixtures.mjs';
import {
  agentPromptHash,
  CONTRACT_PATH,
  fixtureTask,
  verifierSubject,
  verifierTrial,
} from './verifier-envelope.mjs';

const MODEL = 'claude-opus-5-5';
const SUITE = 'verifier-fixtures';
const REPORT_DIR = '.tmp/verifier-evals';
const MAX_TURNS = 1;

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const runVerifier = async ({ dispatch, queuedAt, systemPrompt }) => {
  const open = () =>
    query({
      options: {
        cwd: mkdtempSync(join(tmpdir(), 'verifier-eval-')),
        maxTurns: MAX_TURNS,
        mcpServers: {},
        model: MODEL,
        persistSession: false,
        settingSources: [],
        strictMcpConfig: true,
        systemPrompt,
        tools: [],
      },
      prompt: dispatch,
    });
  const { error, messages, timestamps } = await timedDrain({ open, queuedAt });
  return {
    error: error ?? sessionProblem(messages),
    metrics: sessionMetrics(messages, timestamps, error),
    report: finalResult(messages)?.result ?? '',
  };
};

const CONCURRENCY = 4;

const saveReports = ({ fixture, sessions }) => {
  for (const [index, session] of sessions.entries()) {
    writeFileSync(
      join(REPORT_DIR, `${fixture}-${index + 1}.md`),
      scrubSecrets(reportText(session)),
    );
  }
};

const recordSession = ({
  expectedNotMet,
  fixture,
  index,
  queuedAt,
  record,
  session,
}) => {
  const run = readReport(session);
  record.addTrial(
    verifierTrial({
      error: session.error,
      expectedNotMet,
      fixture,
      matched: runCounts({ expectedNotMet, run }),
      metrics: session.metrics,
      queuedAt,
      run,
      transcript: record.transcript({
        name: `${fixture}-${index + 1}.md`,
        text: reportText(session),
      }),
      trialIndex: index,
    }),
  );
  return session;
};

const jobsFor = ({ fixtures, record, runs, shared }) =>
  fixtures.flatMap(([fixture, expectedNotMet]) => {
    const dispatch = renderDispatch({
      ...shared,
      diff: read(`./${fixture}/change.diff`),
    });
    return Array.from({ length: runs }, (_, index) => {
      const queuedAt = Date.now();
      return async () =>
        recordSession({
          expectedNotMet,
          fixture,
          index,
          queuedAt,
          record,
          session: await runVerifier({
            dispatch,
            queuedAt,
            systemPrompt: shared.systemPrompt,
          }),
        });
    });
  });

const runSuite = async ({ fixtures, record, runs, shared }) => {
  const results = await runBatches(
    chunk(jobsFor({ fixtures, record, runs, shared }), CONCURRENCY),
  );
  const judgements = fixtures.map(([fixture, expectedNotMet], position) => {
    const sessions = results.slice(position * runs, (position + 1) * runs);
    saveReports({ fixture, sessions });
    return judgeFixture({ expectedNotMet, fixture, runs: sessions });
  });
  const { exitCode, footer } = suiteEnd({ judgements, reportDir: REPORT_DIR });
  console.log(
    [
      ...judgements.map(describeJudgement),
      footer,
      costLine(results.map(({ metrics }) => metrics)),
    ].join('\n'),
  );
  process.exitCode = exitCode;
};

const verifierPlan = ({ fixtures, runs, shared }) => {
  const promptHash = agentPromptHash({
    files: [
      { bytes: shared.template, path: `evals/${SUITE}/dispatch.md` },
      { bytes: shared.contract, path: CONTRACT_PATH },
    ],
    systemPrompt: shared.systemPrompt,
  });
  return {
    harnessVersion: runnerHarnessVersion(import.meta.url),
    modelId: MODEL,
    sdkVersion: sdkVersion(),
    settings: runSettings({
      argv: process.argv.slice(2),
      concurrency: CONCURRENCY,
      maxTurns: MAX_TURNS,
      runs,
      selection: fixtures.map(([fixture]) => fixture),
    }),
    subjects: [verifierSubject(shared.definition)],
    suite: SUITE,
    tasks: fixtures.map(([fixture, expectedNotMet]) =>
      fixtureTask({
        agentPromptHash: promptHash,
        diff: read(`./${fixture}/change.diff`),
        expectedNotMet,
        fixture,
        issue: shared.issue,
        suite: SUITE,
      }),
    ),
  };
};

const main = async () => {
  const { values } = parseArgs({
    args: withoutSeparator(process.argv.slice(2)),
    options: { runs: { default: '3', type: 'string' } },
  });
  const runs = runCount(values.runs);
  const definition = read('../../.claude/agents/refactor-verifier.md');
  const shared = {
    contract: read('../../docs/agents/refactor-verified-contract.md'),
    definition,
    issue: read('./issue.md'),
    systemPrompt: agentBody(definition),
    template: read('./dispatch.md'),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const fixtures = Object.entries(JSON.parse(read('./expected.json')));
  await recordRun({
    execute: (record) => runSuite({ fixtures, record, runs, shared }),
    identity: runIdentity(),
    plan: verifierPlan({ fixtures, runs, shared }),
  });
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
