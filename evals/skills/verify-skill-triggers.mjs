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
 * Needs a Claude login, or CLAUDE_CODE_OAUTH_TOKEN in CI.
 * Exit codes: 0 = every task passed, 1 = otherwise.
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
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  chunk,
  costLine,
  errorText,
  runBatches,
  sessionMetrics,
  timedDrain,
} from '../agent-sessions.mjs';

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
  taskPassed,
  taskVerdicts,
  trialCount,
  withoutSeparator,
} from './skill-triggers.mjs';
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
    .map((name) => ({
      ...readTask(readFileSync(join(directory, name), 'utf8')),
      file: join(directory, name),
    }));
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

const attemptTask = async ({ hidden, model, queuedAt, skill, task, trial }) => {
  const { cwd, fixtureFiles } = workspaceFor({ skill, task });
  const scope = sessionScope({ catalog: catalog(), hidden, task });
  const open = () =>
    query({
      options: {
        ...scope,
        cwd,
        maxTurns: 8,
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
  writeFileSync(
    join(REPORT_DIR, `${skill}-${task.id}-${trial}.json`),
    JSON.stringify(messages, null, 2),
  );
  const invoked = invokedSkills(messages);
  const fixtureRead = fixtureWasRead({
    fixtureFiles,
    read: readPaths(messages),
    task,
  });
  return {
    error,
    fixtureRead,
    invoked,
    metrics: sessionMetrics(messages, drained.timestamps, drained.error),
    passed: taskPassed({ error, fixtureRead, invoked, skill, task }),
    skill,
    task,
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

const runTask = (args) =>
  attemptTask(args).catch((error) => ({
    error: errorText(error),
    fixtureRead: true,
    invoked: [],
    passed: false,
    skill: args.skill,
    task: args.task,
    trial: args.trial,
  }));

const assertCoverage = () => {
  const gaps = coverage();
  if (gaps.length > 0) {
    throw new Error(gaps.join('\n'));
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
  mkdirSync(REPORT_DIR, { recursive: true });
  const jobs = selected.flatMap((skill) =>
    tasksOf(skill).flatMap((task) =>
      Array.from({ length: runs }, (_, index) => {
        const queuedAt = Date.now();
        return () =>
          runTask({
            hidden: values.hide,
            model: values.model,
            queuedAt,
            skill,
            task,
            trial: index + 1,
          });
      }),
    ),
  );
  if (jobs.length === 0) {
    throw new Error('the selection resolved to no tasks');
  }
  const results = await runBatches(chunk(jobs, CONCURRENCY));
  const trials = results.map(trialRecord);
  writeFileSync(TRIALS_FILE, JSON.stringify(trials, null, 2));
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
