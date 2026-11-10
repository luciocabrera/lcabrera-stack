#!/usr/bin/env node
/**
 * Seats the fp-judge and fp-adversary prompts, read verbatim from their agent
 * definitions, on each fixture case whose true answer expected.json holds, and
 * scores whether each seat reaches it. A seat runs as `vp run adjudicate:panel`
 * runs it: its own tree, the case file path and nothing else, read-only tools
 * scoped to that tree. So a prompt edit that stops a role finding the true
 * verdict fails here before it reaches a real case.
 *
 * Each run also writes a run envelope under .tmp/eval-results/fp-panel/.
 *
 * Usage (from the repo root): vp run evals:fp-panel [-- <fixture> ...] [--runs <n>] [--model <id>]
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every seat reached the true verdict in every run,
 * 1 = otherwise or bad arguments, 75 = cut off by the session limit,
 * 130/143 = interrupted.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  dispatchPrompt,
  parseVerdict,
} from '../../scripts/lib/adjudication-panel.mjs';
import { PANEL_TOOLS, scopeHook } from '../../scripts/lib/panel-scope.mjs';
import {
  chunk,
  costLine,
  finalResult,
  inScratchDirectory,
  runBatches,
  sessionMetrics,
  sessionProblem,
  timedDrain,
  withoutSeparator,
} from '../agent-sessions.mjs';
import { runSettings } from '../run-envelope.mjs';
import {
  recordRun,
  runExitCode,
  runIdentity,
  runnerHarnessVersion,
  sdkVersion,
} from '../run-record.mjs';
import { writeScrubbed } from '../transcript-scrub.mjs';
import { agentBody } from '../verifier-fixtures/verifier-fixtures.mjs';
import { readFixtureTree, writeCaseTree } from './case-tree.mjs';
import {
  agentPath,
  casePathOf,
  fixtureCaseFile,
  panelSubject,
  panelTask,
  panelTrial,
  promptHashOf,
  ROLES,
  seatLine,
  seatRunCount,
  seatScore,
  selectedFixtures,
  SUITE,
  suiteExitCode,
} from './fp-panel.mjs';

const DEFAULT_MODEL = 'claude-opus-5-5';
const REPORT_DIR = '.tmp/fp-panel-evals';
const MAX_TURNS = 80;
const CONCURRENCY = 4;

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const treeDirectory = (fixture) =>
  fileURLToPath(new URL(`cases/${fixture}/tree`, import.meta.url));

const loadFixture = ({ caseId, fixture, truth }) => {
  const finding = JSON.parse(read(`./cases/${fixture}/finding.json`));
  const files = readFixtureTree(treeDirectory(fixture));
  const casePath = casePathOf(caseId);
  return {
    caseFile: fixtureCaseFile({ caseId, finding, text: files[finding.file] }),
    casePath,
    files,
    fixture,
    truth,
  };
};

const sitIn = async ({ fixture, model, role, tree }) => {
  writeCaseTree({ ...fixture, into: tree });
  const queuedAt = Date.now();
  const { error, messages, timestamps } = await timedDrain({
    open: () =>
      query({
        options: {
          cwd: tree,
          hooks: { PreToolUse: [{ hooks: [scopeHook({ tree })] }] },
          maxTurns: MAX_TURNS,
          mcpServers: {},
          model,
          permissionMode: 'dontAsk',
          persistSession: false,
          settingSources: [],
          strictMcpConfig: true,
          systemPrompt: role.systemPrompt,
          tools: PANEL_TOOLS,
        },
        prompt: dispatchPrompt(fixture.casePath),
      }),
    queuedAt,
  });
  const text = finalResult(messages)?.result ?? '';
  const parsed = parseVerdict({
    exists: (path) => existsSync(join(tree, path)),
    text,
  });
  return {
    metrics: sessionMetrics(messages, timestamps, error),
    problem: parsed.problem,
    queuedAt,
    score: seatScore({
      error: error ?? sessionProblem(messages, PANEL_TOOLS),
      parsed,
      truth: fixture.truth,
    }),
    text,
  };
};

const reportName = ({ fixture, index, role }) =>
  `${fixture}-${role}-${String(index + 1)}.md`;

const reportText = ({ score, text }) =>
  score.error === undefined ? text : `(${score.error})\n\n${text}`;

const recordSeat = ({ fixture, index, record, role, session }) => {
  const name = reportName({ fixture: fixture.fixture, index, role: role.role });
  const text = reportText(session);
  writeScrubbed({ file: join(REPORT_DIR, name), text });
  record.addTrial(
    panelTrial({
      fixture: fixture.fixture,
      metrics: session.metrics,
      queuedAt: session.queuedAt,
      role: role.role,
      score: session.score,
      transcript: record.transcript({ name, text }),
      trialIndex: index,
      truth: fixture.truth,
    }),
  );
  return { ...session, fixture: fixture.fixture, role: role.role };
};

const jobsFor = ({ fixtures, model, record, roles, runs }) =>
  fixtures.flatMap((fixture) =>
    roles.flatMap((role) =>
      Array.from(
        { length: runs },
        (_, index) => async () =>
          recordSeat({
            fixture,
            index,
            record,
            role,
            session: await inScratchDirectory('fp-panel-eval-', (tree) =>
              sitIn({ fixture, model, role, tree }),
            ),
          }),
      ),
    ),
  );

const runSuite = async ({ fixtures, model, record, roles, runs }) => {
  const sessions = await runBatches(
    chunk(jobsFor({ fixtures, model, record, roles, runs }), CONCURRENCY),
    record.isCutOff,
  );
  const lines = fixtures.flatMap(({ fixture, truth }) =>
    roles.map(({ role }) =>
      seatLine({
        fixture,
        role,
        sessions: sessions.filter(
          (session) => session.fixture === fixture && session.role === role,
        ),
        truth,
      }),
    ),
  );
  console.log(
    [
      ...lines,
      `Full reports: ${REPORT_DIR}/`,
      costLine(sessions.map(({ metrics }) => metrics)),
    ].join('\n'),
  );
  process.exitCode = suiteExitCode(sessions);
};

const panelPlan = ({ fixtures, model, roles, runs }) => ({
  harnessVersion: runnerHarnessVersion(import.meta.url),
  modelId: model,
  sdkVersion: sdkVersion(),
  settings: runSettings({
    argv: process.argv.slice(2),
    concurrency: CONCURRENCY,
    maxTurns: MAX_TURNS,
    runs,
    selection: fixtures.map(({ fixture }) => fixture),
    tools: PANEL_TOOLS,
  }),
  subjects: roles.map(({ definition, role }) =>
    panelSubject({ definition, role }),
  ),
  suite: SUITE,
  tasks: fixtures.flatMap((fixture) =>
    roles.map((role) =>
      panelTask({
        fixture: fixture.fixture,
        promptHash: promptHashOf({
          dispatch: dispatchPrompt(fixture.casePath),
          systemPrompt: role.systemPrompt,
        }),
        role: role.role,
        tree: fixture.files,
        truth: fixture.truth,
      }),
    ),
  ),
});

const readRole = (role) => {
  const definition = read(`../../${agentPath(role)}`);
  return { definition, role, systemPrompt: agentBody(definition) };
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: {
      model: { default: DEFAULT_MODEL, type: 'string' },
      runs: { default: '2', type: 'string' },
    },
  });
  const runs = seatRunCount(values.runs);
  const fixtures = selectedFixtures({
    expected: JSON.parse(read('./expected.json')),
    names: positionals,
  }).map((fixture) => loadFixture(fixture));
  const roles = ROLES.map((role) => readRole(role));
  mkdirSync(REPORT_DIR, { recursive: true });
  await recordRun({
    execute: (record) =>
      runSuite({ fixtures, model: values.model, record, roles, runs }),
    identity: runIdentity(),
    plan: panelPlan({ fixtures, model: values.model, roles, runs }),
  });
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = runExitCode(error);
}
