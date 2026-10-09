#!/usr/bin/env node
/**
 * Runs each skill's Waza trigger tasks through Claude Code, via the Agent SDK,
 * and checks whether the session invoked the skill. The session sees the whole
 * catalog and nothing else: no CLAUDE.md, no hooks, no MCP, and only the Skill
 * tool, plus Read when a task copies in a fixture for a path-scoped skill.
 *
 * Usage (from the repo root): vp run evals:skills [-- <skill> ...] [--model <id>]
 *   [--runs <n>]      trials per task, 3 by default; a task passes only if every trial does
 *   [--hide <skill>]  leave a skill out of the session, to prove its trigger task can fail
 *   [--check]         only check coverage, with no model call: every skill has five trigger
 *                     and five near-miss tasks, every task a unique id, a set tag and a
 *                     boolean should_trigger, and a skill with a paths: list names a
 *                     fixture in each
 * Each run also writes a run envelope under .tmp/eval-results/skills/.
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every task passed, 1 = otherwise, 130/143 = interrupted.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';
import { fileSetHash } from '@repo/eval-history/hashing/fileSetHash.util';
import { readFileSet } from '@repo/eval-history/hashing/readFileSet.service';
import { skillHashes } from '@repo/eval-history/hashing/skillHashes.util';

import {
  chunk,
  costLine,
  errorText,
  runBatches,
  sessionMetrics,
  timedDrain,
} from '../agent-sessions.mjs';
import { runSettings, skillSubjects } from '../run-envelope.mjs';
import {
  recordRun,
  runIdentity,
  runnerHarnessVersion,
  sdkVersion,
} from '../run-record.mjs';
import { writeScrubbed } from '../transcript-scrub.mjs';

import {
  coverageProblems,
  describeVerdict,
  fixtureWasRead,
  invokedSkills,
  isPathScoped,
  readEvalSkill,
  readPaths,
  readTask,
  scopeError,
  selectedSkills,
  sessionError,
  sessionScope,
  sessionTools,
  taskPassed,
  taskVerdicts,
  trialCount,
  withoutSeparator,
} from './skill-triggers.mjs';
import { skillTask, skillTrial } from './skill-envelope.mjs';
import {
  confusionMatrix,
  formatMatrix,
  trialRecord,
} from './trigger-matrix.mjs';

const EVALS_ROOT = 'evals/skills';
const SKILLS_ROOT = '.github/skills';
const REPORT_DIR = '.tmp/skill-evals';
const FIXTURE_SUFFIX = '.fixture';
const TRIALS_FILE = join(REPORT_DIR, 'trials.json');
const CONCURRENCY = 4;
const MAX_TURNS = 8;

const evalDirectories = () =>
  readdirSync(EVALS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(EVALS_ROOT, name, 'eval.yaml')))
    .toSorted((a, b) => a.localeCompare(b));

const tasksOf = (skill) => {
  const directory = join(EVALS_ROOT, skill, 'tasks');
  return readdirSync(directory)
    .filter((name) => name.endsWith('.yaml'))
    .toSorted((a, b) => a.localeCompare(b))
    .map((name) => {
      const definition = readFileSync(join(directory, name), 'utf8');
      return {
        ...readTask(definition),
        definition,
        file: join(directory, name),
      };
    });
};

const copyFixture = ({ cwd, skill, task }) => {
  const source = join(EVALS_ROOT, skill, 'fixtures', task.fixture);
  const files = readdirSync(source, { recursive: true })
    .map(String)
    .filter((path) => statSync(join(source, path)).isFile());
  if (files.length === 0) {
    throw new Error(`fixture ${skill}/fixtures/${task.fixture} has no files`);
  }
  cpSync(source, cwd, { recursive: true });
  return files.map((path) => {
    if (!path.endsWith(FIXTURE_SUFFIX)) {
      return path;
    }
    const target = path.slice(0, -FIXTURE_SUFFIX.length);
    renameSync(join(cwd, path), join(cwd, target));
    return target;
  });
};

const workspaceFor = ({ skill, task }) => {
  const cwd = mkdtempSync(join(tmpdir(), 'skill-eval-'));
  mkdirSync(join(cwd, '.claude'));
  symlinkSync(resolve(SKILLS_ROOT), join(cwd, '.claude', 'skills'));
  const fixtureFiles =
    task.fixture === undefined ? [] : copyFixture({ cwd, skill, task });
  return { cwd, fixtureFiles };
};

const catalog = () =>
  readdirSync(SKILLS_ROOT).filter((name) =>
    existsSync(join(SKILLS_ROOT, name, 'SKILL.md')),
  );

const attemptTask = async ({
  hidden,
  model,
  queuedAt,
  record,
  skill,
  task,
  trial,
}) => {
  const { cwd, fixtureFiles } = workspaceFor({ skill, task });
  const scope = sessionScope({ catalog: catalog(), hidden, task });
  const open = () =>
    query({
      options: {
        ...scope,
        cwd,
        maxTurns: MAX_TURNS,
        mcpServers: {},
        model,
        persistSession: false,
        settingSources: ['project'],
        strictMcpConfig: true,
      },
      prompt: task.prompt,
    });
  const drained = await timedDrain({ open, queuedAt });
  const { messages } = drained;
  const error =
    drained.error ??
    sessionError(messages) ??
    scopeError({ expectedTools: scope.tools, messages });
  const name = `${skill}-${task.id}-${trial}.json`;
  const text = JSON.stringify(messages, null, 2);
  writeScrubbed({ file: join(REPORT_DIR, name), text });
  const invoked = invokedSkills(messages);
  const fixtureRead = fixtureWasRead({
    fixtureFiles,
    read: readPaths(messages),
    task,
  });
  return {
    error,
    fixtureRead,
    initTools: sessionTools(messages) ?? [],
    invoked,
    metrics: sessionMetrics(messages, drained.timestamps, drained.error),
    passed: taskPassed({ error, fixtureRead, invoked, skill, task }),
    skill,
    task,
    transcript: record.transcript({ name, text }),
    trial,
  };
};

const coverage = () =>
  coverageProblems({
    catalog: catalog().map((name) => ({
      name,
      scoped: isPathScoped(
        readFileSync(join(SKILLS_ROOT, name, 'SKILL.md'), 'utf8'),
      ),
    })),
    declared: new Map(
      evalDirectories().map((name) => [
        name,
        readEvalSkill(
          readFileSync(join(EVALS_ROOT, name, 'eval.yaml'), 'utf8'),
        ),
      ]),
    ),
    evals: new Map(evalDirectories().map((name) => [name, tasksOf(name)])),
  });

const runTask = async (args) => {
  const result = await attemptTask(args).catch((error) => ({
    error: errorText(error),
    fixtureRead: true,
    invoked: [],
    passed: false,
    skill: args.skill,
    task: args.task,
    trial: args.trial,
  }));
  args.record.addTrial(skillTrial({ ...result, queuedAt: args.queuedAt }));
  return result;
};

const assertCoverage = () => {
  const gaps = coverage();
  if (gaps.length > 0) {
    throw new Error(gaps.join('\n'));
  }
};

const fixtureHashOf = async ({ skill, task }) =>
  task.fixture === undefined
    ? null
    : fileSetHash(
        await readFileSet({
          directory: join(EVALS_ROOT, skill, 'fixtures', task.fixture),
        }),
      );

const selectionTasks = (selected) =>
  selected.flatMap((skill) => tasksOf(skill).map((task) => ({ skill, task })));

const offeredTools = ({ hidden, tasks }) =>
  [
    ...new Set(
      tasks.flatMap(
        ({ task }) => sessionScope({ catalog: catalog(), hidden, task }).tools,
      ),
    ),
  ].toSorted((a, b) => a.localeCompare(b));

const skillPlan = async ({ runs, selected, values }) => {
  const tasks = selectionTasks(selected);
  const hashes = skillHashes(await readFileSet({ directory: SKILLS_ROOT }));
  return {
    catalogHash: hashes.catalog_hash,
    harnessVersion: runnerHarnessVersion(import.meta.url),
    modelId: values.model,
    sdkVersion: sdkVersion(),
    settings: runSettings({
      argv: process.argv.slice(2),
      concurrency: CONCURRENCY,
      hidden: values.hide,
      maxTurns: MAX_TURNS,
      runs,
      selection: selected,
      tools: offeredTools({ hidden: values.hide, tasks }),
    }),
    subjects: skillSubjects({ hashes, selected }),
    suite: 'skills',
    tasks: await Promise.all(
      tasks.map(async ({ skill, task }) =>
        skillTask({
          fixtureHash: await fixtureHashOf({ skill, task }),
          skill,
          source: task.definition,
          task,
        }),
      ),
    ),
  };
};

const jobsFor = ({ record, runs, selected, values }) =>
  selectionTasks(selected).flatMap(({ skill, task }) =>
    Array.from({ length: runs }, (_, index) => {
      const queuedAt = Date.now();
      return () =>
        runTask({
          hidden: values.hide,
          model: values.model,
          queuedAt,
          record,
          skill,
          task,
          trial: index + 1,
        });
    }),
  );

const report = (results) => {
  const trials = results.map(trialRecord);
  writeScrubbed({ file: TRIALS_FILE, text: JSON.stringify(trials, null, 2) });
  const verdicts = taskVerdicts(results);
  console.log(verdicts.map(describeVerdict).join('\n'));
  console.log(`\n${formatMatrix(confusionMatrix(trials))}\n`);
  console.log(`Transcripts: ${REPORT_DIR}/`);
  console.log(`Trials: ${TRIALS_FILE}`);
  console.log(costLine(results.map(({ metrics }) => metrics)));
  if (verdicts.some(({ verdict }) => verdict !== 'ok')) {
    process.exitCode = 1;
  }
};

const runSelection = async ({ positionals, values }) => {
  const runs = trialCount(values.runs);
  const selected = selectedSkills({
    catalog: catalog(),
    evals: evalDirectories(),
    hidden: values.hide,
    requested: positionals,
  });
  if (selectionTasks(selected).length === 0) {
    throw new Error('the selection resolved to no tasks');
  }
  mkdirSync(REPORT_DIR, { recursive: true });
  const identity = runIdentity();
  await recordRun({
    execute: async (record) =>
      report(
        await runBatches(
          chunk(jobsFor({ record, runs, selected, values }), CONCURRENCY),
        ),
      ),
    identity,
    plan: await skillPlan({ runs, selected, values }),
  });
};

const main = async () => {
  const parsed = parseArgs({
    allowPositionals: true,
    args: withoutSeparator(process.argv.slice(2)),
    options: {
      check: { default: false, type: 'boolean' },
      hide: { default: [], multiple: true, type: 'string' },
      model: { default: 'claude-opus-5-5', type: 'string' },
      runs: { default: '3', type: 'string' },
    },
  });
  assertCoverage();
  if (parsed.values.check) {
    console.log(`Coverage passed for ${catalog().length} skill(s).`);
    return;
  }
  await runSelection(parsed);
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
